import {
  RequestParams,
  RawResponseParams,
  ResponseParams,
  Config,
} from './types.js';
import { API_URL, REQUEST_ALTERNATIVES } from './const.js';

function buildRequestParams(sourceLang = 'auto', targetLang = 'en') {
  return {
    jsonrpc: '2.0',
    method: 'LMT_handle_texts',
    id: Math.floor(Math.random() * 100000 + 100000) * 1000,
    params: {
      texts: [{ text: '', requestAlternatives: REQUEST_ALTERNATIVES }],
      timestamp: 0,
      splitting: 'newlines',
      lang: {
        source_lang_user_selected: sourceLang?.toUpperCase(),
        target_lang: targetLang?.toUpperCase(),
      },
    },
  };
}

function buildProRequestParams(sourceLang = 'auto', targetLang = 'en') {
  const regionalVariantFlag = new Map([
    ['EN', 'en-US'],
    ['ZH', 'zh-Hans'],
  ]);
  return {
    jsonrpc: '2.0',
    method: 'LMT_handle_jobs',
    id: Math.floor(Math.random() * 100000 + 100000) * 1000,
    params: {
      commonJobParams: {
        advancedMode: ['EN', 'DE', 'ZH', 'JA'].includes(
          sourceLang?.toUpperCase()
        ),
        browserType: 1,
        mode: 'translate',
        textType: 'plaintext', // TODO
        quality: 'normal',
        ...(regionalVariantFlag.get(targetLang.toUpperCase()) && {
          regionalVariant: regionalVariantFlag.get(targetLang.toUpperCase()),
        }),
      },
      jobs: [] as unknown[],
      timestamp: 0,
      lang: {
        target_lang: targetLang?.toUpperCase(),
        preference: { weight: {}, default: 'default' },
        source_lang_computed: sourceLang?.toUpperCase(),
      },
      priority: 1,
    },
  };
}

function countLetterI(translateText: string) {
  return (translateText || '').split('i').length - 1;
}

function getTimestamp(letterCount: number) {
  const timestamp = new Date().getTime();
  return letterCount !== 0
    ? timestamp - (timestamp % (letterCount + 1)) + (letterCount + 1)
    : timestamp;
}

function buildRequestBody(data: RequestParams) {
  const requestData = buildRequestParams(data.source_lang, data.target_lang);
  requestData.params.texts = [
    { text: data.text, requestAlternatives: REQUEST_ALTERNATIVES },
  ];
  requestData.params.timestamp = getTimestamp(countLetterI(data.text));

  let requestString = JSON.stringify(requestData);
  if (
    [0, 3].includes((requestData['id'] + 5) % 29) ||
    (requestData['id'] + 3) % 13 === 0
  ) {
    requestString = requestString.replace('"method":"', '"method" : "');
  } else {
    requestString = requestString.replace('"method":"', '"method": "');
  }

  return requestString;
}

function buildProRequestBody(data: RequestParams) {
  const requestData = buildProRequestParams(data.source_lang, data.target_lang);
  requestData.params.jobs = [
    {
      kind: 'default',
      sentences: [
        {
          text: data.text,
          id: 1,
          prefix: '',
        },
      ],
      raw_en_context_before: [],
      raw_en_context_after: [],
      preferred_num_beams: 4,
    },
  ];
  requestData.params.timestamp = getTimestamp(countLetterI(data.text));

  let requestString = JSON.stringify(requestData);
  if (
    [0, 3].includes((requestData['id'] + 5) % 29) ||
    (requestData['id'] + 3) % 13 === 0
  ) {
    requestString = requestString.replace('"method":"', '"method" : "');
  } else {
    requestString = requestString.replace('"method":"', '"method": "');
  }

  return requestString;
}

type RawProResponseParams = {
  jsonrpc: string;
  id: number;
  result: {
    translations: Array<{
      beams: { sentences: { text: string; ids: number[] }[] }[];
      quality: string;
    }>;
    target_lang: string;
    source_lang: string;
    source_lang_is_confident: boolean;
    detectedLanguages: {};
  };
};

async function query(
  params: RequestParams,
  config?: Config
): Promise<ResponseParams> {
  if (!params?.text) {
    return {
      code: 404,
      message: 'No Translate Text Found',
      data: null,
    };
  }
  // console.log(buildProRequestBody(params));
  const response = await fetch(config?.proxyEndpoint ?? API_URL, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...config?.customHeader,
    },
    method: 'POST',
    body:
      config?.customHeader && config?.customHeader['Cookie']
        ? buildProRequestBody(params)
        : buildRequestBody(params),
    // backend: "deepl",
  });
  // console.log(response);

  if (response.ok) {
    if (config?.customHeader && config?.customHeader['Cookie']) {
      const { result } = (await response.json()) as RawProResponseParams;
      const translations = result && result.translations;
      if (
        translations &&
        translations.length > 0 &&
        translations[0].beams.length > 0
      ) {
        const texts = translations[0].beams.flatMap(beam =>
          beam.sentences.map(sentence => sentence.text)
        );
        return {
          code: 200,
          message: 'success',
          data: texts[0],
          alternatives: texts.slice(1), // 返回剩余的备用翻译
        };
      } else {
        return {
          code: 404,
          message: 'empty result',
          data: null,
        };
      }
    } else {
      const { result } = (await response.json()) as RawResponseParams;
      return {
        code: 200,
        message: 'success',
        data: result?.texts?.[0]?.text,
        source_lang: params?.source_lang || result?.lang || 'auto',
        target_lang: params?.target_lang || 'en',
        alternatives: result.texts?.[0]?.alternatives?.map?.(item => item.text),
      };
    }
  } else {
    return {
      code: response.status,
      data: null,
      message:
        response.status === 429
          ? 'Too many requests, please try again later.'
          : 'Unknown error.',
    };
  }
}

export { query };
