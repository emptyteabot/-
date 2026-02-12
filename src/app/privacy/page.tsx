import Link from 'next/link'

export const metadata = {
  title: '隐私政策 | 月见',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">隐私政策</h1>
          <Link href="/" className="text-sm text-slate-500 transition hover:text-slate-900">返回首页</Link>
        </div>

        <div className="glass-card space-y-4 p-6 text-sm leading-7 text-slate-700">
          <p className="text-slate-500">生效日期：{new Date().toLocaleDateString('zh-CN')}</p>

          <section>
            <h2 className="font-semibold text-slate-900">1. 我们处理哪些数据</h2>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>你上传的聊天截图或粘贴的聊天文本（用于生成报告）。</li>
              <li>访问与行为事件（用于产品优化和转化分析）。</li>
              <li>你主动提交的联系方式（用于售后或服务沟通）。</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900">2. 我们如何使用数据</h2>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>生成情感分析、占卜解读、内容改写等结果。</li>
              <li>优化提示词、流程和错误处理能力。</li>
              <li>进行漏斗与来源分析，改进整体体验。</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900">3. 第三方服务与跨境传输</h2>
            <p className="mt-1">
              为完成 OCR 与 AI 生成，你提交的内容可能会发送给第三方 AI 服务商处理，服务节点可能位于不同地区。
              如果你不同意，请勿上传或粘贴任何内容。
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900">4. 你的义务</h2>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>确保你有权处理所上传内容，必要时获得相关授权。</li>
              <li>在提交前自行打码敏感信息（手机号、地址、证件号等）。</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
