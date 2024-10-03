import { Buffer } from "node:buffer"
import { $fetch } from "ofetch"
import * as cheerio from "cheerio"
import iconv from "iconv-lite"
import type { NewsItem, OResponse } from "@shared/types"
import { tranformToUTC } from "#/utils/date"

const columns = [
  "人物记事",
  "观点评论",
  "中国聚焦",
  "香港澳门",
  "台湾新闻",
  "国际时政",
  "国际军事",
  "国际视野",
] as const
// type: "中国聚焦" | "人物记事" | "观点评论"
export async function zaobao(type: typeof columns[number] = "中国聚焦"): Promise<OResponse> {
  const response = await $fetch("https://www.kzaobao.com/top.html", {
    responseType: "arrayBuffer",
  })
  const base = "https://www.kzaobao.com"
  const utf8String = iconv.decode(Buffer.from(response), "gb2312")
  const $ = cheerio.load(utf8String)
  const $main = $(`#cd0${columns.indexOf(type) + 1}`)
  const news: NewsItem[] = []
  $main.find("tr").each((_, el) => {
    const a = $(el).find("h3>a")
    // https://www.kzaobao.com/shiju/20241002/170659.html
    const url = a.attr("href")
    const title = a.text()
    if (url && title) {
      const date = $(el).find("td:nth-child(3)").text()
      news.push({
        url: base + url,
        title,
        id: url,
        extra: {
          date: date && tranformToUTC(date),
        },
      })
    }
  })
  return {
    status: "success",
    data: {
      name: `联合早报`,
      type,
      updateTime: Date.now(),
      items: news,
    },
  }
}
