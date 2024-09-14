# DeepLX

下面是 fork 所做更改：

* 改为用 tsup 而非 tsdx 打包。
* 包管理改为 pnpm。
* 支持 DeepLX Pro API，并调用[新模型](https://www.deepl.com/zh/blog/next-gen-language-model)。
* 为便于朋友部署，起了 deno 服务和 compose 配置。

以下可以做，但是不太有心情：

* 支持富文本翻译。这主要取决于沉浸式翻译是否愿意支持。
* 支持段落切分。
* 支持 quality: fast

需要注意，[某实现](https://github.com/xiaozhou26/deeplx-pro)的 quality: fast 实际已经损坏，响应的结果是缩略版原文，并没有译出。 ~~你就说快不快吧~~

以下是已知问题：

* 标准 DeepLX 汉语译文用全角标点而新模型用半角标点，这是官方前端也有的问题。
* 如果文本过长，译文可能为非常精炼的词汇或者词汇重复很多遍。谷歌翻译抽风的历史已经为人们熟知（[1](https://www.vice.com/en/article/why-is-google-translate-spitting-out-sinister-religious-prophecies/)，[2](https://news.ycombinator.com/item?id=41335352)），但仅限于无意义的文本输入，而本模型的错误在完全正确仅仅长度略长的文本中即可抽风。官方不存在此问题是因为会预先分句，每段并不长，而整体请求、\n 分段是 DeepLX 通用的方式。缓解办法仅为设置请求长度为2000字符以内。[某实现](https://github.com/xiaozhou26/deeplx-pro)亦受影响。
* 脚注等符号多、格式刻板的文本，也会形成简短而怪异的响应。
* 许多文本翻译怪异，质量甚至不如普通模型。例如以下文本（[出处](https://tommorris.org/posts/2024/lies-damn-lies-and-business-cases-for-ai-hype/)）：

<p><details>
<summary>原文及译文</summary>

You’ll note that these tasks are ones anyone could tell you that large language models are quite good at, because there is no link between the task and actual reality. In addition, I’m a little dubious about how much effort most people are going to put into an online study when compared to the amount of effort they are likely to put into their actual job, where the consequences of performing badly include loss of income, social embarassment, and lack of professional advancement–all of which are rather more significant than missing out on a couple of extra dollars in one’s beer money pot.

你会发现,这些任务都是任何人都能告诉你的,大型语言模型非常擅长,因为任务和现实之间没有联系。此外,与大多数人可能投入实际工作的精力相比,我对大多数人将投入在线学习的精力多少感到有些怀疑,因为实际工作中表现不佳的后果包括收入损失、社交尴尬和职业发展停滞,这些后果都比错过几美元啤酒钱要严重得多。

</details></p>

第一句话的质量显然不如下列文本（虽然后半段新模型我认为略好）：

<p><details>
<summary>普通模型译文</summary>

你会注意到，这些任务是任何人都可以告诉你大型语言模型非常擅长的任务，因为任务与实际情况之间没有联系。此外，我还有点怀疑大多数人在网上学习时会投入多少精力，而他们在实际工作中可能会投入多少精力，在实际工作中表现不佳的后果包括收入损失、社交尴尬和缺乏职业发展--所有这些都比在自己的啤酒钱罐里多损失几块钱要重要得多。

</details></p>

我发现最好的译文出现在 alternatives，但某些机器上相同文本出现在 data，排序不同，原因未知。我认为一次只翻译一段有助于缓解问题。

----

⚡️ DeepLX API npm package.

[![test](https://badgen.net/github/checks/ifyour/deeplx/main?label=%20CI)](https://github.com/ifyour/deeplx/actions/workflows/main.yml)
[![dw](https://badgen.net/npm/dt/@ifyour/deeplx?label=Downloads)](https://www.npmjs.com/package/@ifyour/deeplx)

## Usage

```bash
npm i @ifyour/deeplx
```

In your backend service, install and use this package, you can use any backend framework you like. Here's a demo of my deployment on [AirCode](https://aircode.io), you can [click here](https://github.com/ifyour/deeplx-js) to deploy one of your own.

```js
import { query } from '@ifyour/deeplx';

export default async function(params, context) {
  return await query(params);
}
```

```curl
curl --location 'https://nw6usm5uha.us.aircode.run/demo' \
--header 'Content-Type: application/json' \
--data '{
    "text": "你好，世界",
    "source_lang": "zh",
    "target_lang": "en"
}'
```

```json
{
  "code": 200,
  "message": "success",
  "data": "Hello, world.",
  "source_lang": "zh",
  "target_lang": "en",
  "alternatives": ["Hello, World.", "Hello, world!", "Hi, world."]
}
```

![demo](https://images.mingming.dev/file/d1c6fd89334f18b34d9ac.png)

## Dev

```bash
yarn install

# You need to install bun, please refer to https://bun.sh
yarn run dev

yarn run test

yarn run lint --fix
```

## Known issues

Based on current testing, Cloudflare and Cloudflare-based edge function runtimes (Vercel) are not able to correctly request the DeepL server, and a 525 error occurs, a detailed description of the issue can be found [here](https://github.com/cloudflare/workerd/issues/776).

For this case, it can be solved using the [DeepL proxy server](https://github.com/ifyour/deepl-proxy), please refer to the code [example](https://github.com/ifyour/deeplx-for-cloudflare).

## License

DeepLX is available under the MIT license.
