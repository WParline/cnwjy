---
title: 屏蔽/重定向网站的安全中心
coverImage: "/img/屏蔽-重定向网站的安全中心.jpg"
pubDate: 2022-05-10T01:19:07.000Z
tags: [Firefox, Edge, Redirector]
category: 软件使用
---

## Redirector

在某些页面上自动重定向到用户定义的 url

## 安装Redirector

- [Edge](https://microsoftedge.microsoft.com/addons/detail/redirector/jdhdjbcalnfbmfdpfggcogaegfcjdcfp?hl=zh-CN)
- [Firefox](https://addons.mozilla.org/zh-CN/firefox/addon/redirector/?utm_source=addons.mozilla.org&utm_medium=referral&utm_content=search)
- [Chrome](https://chrome.google.com/webstore/detail/redirector/ocgpenflpmgnfapjedencafcfakcekcd/related?hl=en-US)

## 创建自己的重定向规则

### 步骤

1. 转到插件/扩展编辑页
2. 点击 **Create Redirect**
3. 在 **Description** 输入重定向描述
4. 在 **Example URL** 输入需要重定向的网址以作示例
5. 在 **Include pattern** 输入网址的匹配模式
6. 在 **Redirect to** 输入需要匹配的结果样式
7. **Pattern type** 选择 **Wildcard**
8. 在 **Pattern Description** 输入自己对匹配模式的描述，可不写
9. 点击 **Show advanced options...** 展开高级选项
10. 在 **Process matches** 中选择 **URL Decode**
11. 最终 **Example result** 会显示示例的重定向结果，点击 **Save** 并激活（默认激活）即可生效

### 我的重定向

[我的重定向导出文件](Redirector.json)

- 重定向知乎安全中心

  ``` json
  {
      "description": "跳过知乎安全中心提醒-https",
      "exampleUrl": "https://link.zhihu.com/?target=https%3A//cnwjy.site",
      "exampleResult": "https://cnwjy.site",
      "error": null,
      "includePattern": "https://link.zhihu.com/?target=*",
      "excludePattern": "",
      "patternDesc": "",
      "redirectUrl": "$1",
      "patternType": "W",
      "processMatches": "urlDecode",
      "disabled": false,
      "grouped": false,
      "appliesTo": [
          "main_frame"
      ]
  },
  {
      "description": "跳过知乎安全中心提醒-http",
      "exampleUrl": "https://link.zhihu.com/?target=http%3A//cnwjy.site",
      "exampleResult": "http://cnwjy.site",
      "error": null,
      "includePattern": "https://link.zhihu.com/?target=*",
      "excludePattern": "",
      "patternDesc": "",
      "redirectUrl": "$1",
      "patternType": "W",
      "processMatches": "urlDecode",
      "disabled": false,
      "grouped": false,
      "appliesTo": [
          "main_frame"
      ]
  }
  ```

- 重定向CSDN安全中心

  ```json
  {
      "description": "跳过CSDN安全中心提醒-https",
      "exampleUrl": "https://link.csdn.net/?target=https%3A%2F%2Fcnwjy.site%2F",
      "exampleResult": "https://cnwjy.site/",
      "error": null,
      "includePattern": "https://link.csdn.net/?target=*",
      "excludePattern": "",
      "patternDesc": "",
      "redirectUrl": "$1",
      "patternType": "W",
      "processMatches": "urlDecode",
      "disabled": false,
      "grouped": false,
      "appliesTo": [
          "main_frame"
      ]
  },
  {
      "description": "跳过CSDN安全中心提醒-http",
      "exampleUrl": "https://link.csdn.net/?target=http%3A%2F%2Fcnwjy.site%2F",
      "exampleResult": "http://cnwjy.site/",
      "error": null,
      "includePattern": "https://link.csdn.net/?target=*",
      "excludePattern": "",
      "patternDesc": "",
      "redirectUrl": "$1",
      "patternType": "W",
      "processMatches": "urlDecode",
      "disabled": false,
      "grouped": false,
      "appliesTo": [
          "main_frame"
      ]
  }
  ```

如有其他网站的需要可联系我，未完待续。。。
