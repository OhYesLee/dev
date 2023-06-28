import puppeteer, { Dialog } from "puppeteer";
import fs from "fs";
import axios from "axios";

const launchConfig = {
  headless: true,
  defaultViewport: null,
  ignoreDefaultArgs: ["--disable-extensions"],
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-notifications",
    "--disable-extensions",
  ],
};

let browser;
let page;
let sido, sigungu;
const lengthSelector =
  "body > table:nth-child(2) > tbody > tr > td:nth-child(1) > table > tbody > tr > td:nth-child(2) > table > tbody > tr:nth-child(5) > td > table:nth-child(5) > tbody > tr:nth-child(4) > td > table > tbody > tr > td:nth-child(3)";
let pageLength;
let finalData = [];
//launch 는 페이지 가져오기
const launch = async (sidoCode, sigunguCode) => {
  browser = await puppeteer.launch(launchConfig);
  page = await browser.pages();
  page = page[0];
  sido = sidoCode;
  sigungu = sigunguCode;
};
//goto 페이지 이동
//비동기 함수에서는 await 를 위해 async를 써야한다.
const goto = async (url) => {
  await page.goto(url);
};
//팝업창 닫기
const checkPopup = async () => {
  const pages = await browser.pages();
  //pages[1] array이기 때문에 팝업창이 1번이다.
  await pages[1].close();
};
// evalSido 서울 클릭하는 함수
const evalSido = async () => {
  await page.evaluate((sido) => {
    // 백틱은 option ~ 를 누르면 된다.
    document.querySelector(`#continents > li.${sido} > a`).click();
  }, sido);
};
//evalSigungu 구 선택
const evalSigungu = async () => {
  const pageSelector = `#continents > li.${sigungu} > a`;
  //waitForSelector 돔이 기다려지는걸 기다린다.
  await page.waitForSelector(pageSelector);
  await page.evaluate((pageSelector) => {
    document.querySelector(pageSelector).click();
  }, pageSelector);
};
//closeAlert 경고창 닫는 함수
const closeAlert = async () => {
  await page.on("dialog", async (dialog) => {
    await dialog.accept();
  });
};

const getPageLength = async () => {
  await page.waitForSelector(lengthSelector);
  pageLength = await page.evaluate((lengthSelector) => {
    return document.querySelector(lengthSelector).children.length;
  }, lengthSelector);
  console.log(pageLength);
};

const getData = async () => {
  const maxLength = 10;
  let currentIndex = 1;
  let condition = true;

  while (condition) {
    await page.waitForSelector(lengthSelector);
    const jsonData = await page.evaluate(
      (sido, sigungu) => {
        const targetEl = document.querySelectorAll(
          "#printZone > table:nth-child(2) > tbody > tr"
        );
        var data = Array.from(targetEl)
          .map((el) => {
            const tdArr = el.querySelectorAll("td");
            const name = tdArr[1]?.innerText;
            const addr = tdArr[2]?.innerText
              .replaceAll("\n", "")
              .replaceAll("\t", "");
            const tel = tdArr[3]?.innerText;
            const open = tdArr[4]?.innerText
              .replaceAll("\n", "")
              .replaceAll("\t", "");
            return {
              name,
              addr,
              tel,
              open,
              sido,
              sigungu,
            };
          })
          .filter((data) => data.name != undefined);
        return data;
      },
      sido,
      sigungu
    ); //end evaluate

    finalData = finalData.concat(jsonData);
    console.log("currentPage", i);
    if (i != pageLength) {
      //paging click
      await page.evaluate(
        (lengthSelector, i) => {
          document.querySelector(lengthSelector).children[i].click();
        },
        lengthSelector,
        i
      );
      await page.waitForSelector("#printZone");
    } //end if
  } // end while

  for (let i = 0; i < pageLength; i++) {} //end loop
  browser.close();
}; //end getData

const getAddr = async (data) => {
  const url = "https://dapi.kakao.com/v2/local/search/address.json";
  //   const endpoint = "https://dapi.kakao.com/v2/local/search/address.json";
  const result = await axios.get(url, {
    params: {
      query: data.addr,
    },
    headers: {
      Authorization: "KakaoAK cebd1cb9f4f006f46fffda81279ee189",
    },
  });

  if (result.data.document.length > 0) {
    const { x, y } = result.data.documents[0].address;
    data.lng = x;
    data.lng = y;
  }
  return data;

  const { x, y } = result.data.documents[0]?.address;
  data.lng = x;
  data.lng = y;
  console.log(x, y);
};

const writefile = async () => {
  const promiseArr = finalData.map((data) => getAddr(data));
  // 1초 200개면 200초인데 동시에 1초~2초안에 끝나게 하는
  finalData = await Promise.all(promiseArr);

  const writePath = `./json/${sido}`;
  const exist = fs.existsSync(`../json/${sido}`);

  if (!exist) {
    fs.mkdir(writePath, { recursive: true }, (err) => {});
  }
  const filePath = `${writePath}/${sigungu}.json`;
  const stringData = JSON.stringify(finalData);
  fs.writeFileSync(filePath, stringData);
};
//export를 잘해줘야한다.
export {
  launch,
  goto,
  checkPopup,
  evalSido,
  evalSigungu,
  closeAlert,
  getPageLength,
  getData,
  writefile,
  getAddr,
};
