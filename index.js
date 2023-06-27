import {
  goto,
  launch,
  checkPopup,
  evalSido,
  evalSigungu,
  closeAlert,
  getPageLength,
  getData,
  writefile,
  getAddr,
} from "./module/crawler.js";

async function main() {
  getAddr();
  //   await launch("seoul", "kangnam_gu");
  //   await goto("https://www.pharm114.or.kr/main.asp");
  //   await checkPopup();
  //   await evalSido();
  //   await evalSigungu();
  //   await closeAlert();
  //   await getPageLength();
  //   await getData();
  //   writefile();
  //   process.exit(1);
}

main();
