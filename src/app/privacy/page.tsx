import Link from 'next/link'

export const metadata = {
  title: '隐私政策 | 月见',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-black">隐私政策</h1>
          <Link href="/" className="text-slate-500 text-sm hover:text-slate-900">
            返回首页
          </Link>
        </div>

        <div className="glass-card p-6 text-sm text-slate-700 space-y-4 leading-7">
          <p className="text-slate-500">生效日期：{new Date().toLocaleDateString('zh-CN')}</p>

          <section className="space-y-2">
            <h2 className="text-slate-900 font-bold">1. 我们处理哪些数据</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>你粘贴的聊天文本，或你上传的聊天截图（用于识别与生成报告）。</li>
              <li>基础访问与行为事件（用于统计转化与改进产品体验）。</li>
              <li>你主动提供的联系方式（如你在支付或售后场景提交）。</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-slate-900 font-bold">2. 我们如何使用你的数据</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>生成“感情透视报告 / 塔罗解读 / 文案改写”等结果内容。</li>
              <li>改善模型提示词、页面流程、错误定位与风控。</li>
              <li>进行增长分析（来源、漏斗转化、分享点击等）。</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-slate-900 font-bold">3. 第三方服务与跨境传输</h2>
            <p>
              为生成报告与识别截图，我们会将你提交的文本/图片发送给第三方 AI 服务商进行处理。不同服务商的服务器可能位于不同国家或地区。
              这意味着你的数据可能发生跨境传输。若你不同意，请不要上传或粘贴任何内容。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-slate-900 font-bold">4. 数据存储与保留</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>我们不以“长期可检索数据库”的形式保存你的聊天内容作为产品默认行为。</li>
              <li>你的浏览器可能会本地保存部分状态（例如是否付费、体验次数）。你可以在浏览器设置中清理。</li>
              <li>第三方 AI 服务商可能会根据其政策保留请求日志。你应同时阅读其隐私政策与数据保留说明。</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-slate-900 font-bold">5. 你的义务与授权</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>你应确保对聊天记录/截图拥有合法的处理权限与必要的他人同意。</li>
              <li>请在提交前自行打码敏感信息（手机号、地址、身份证号、银行卡号等）。</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-slate-900 font-bold">6. 联系我们与删除请求</h2>
            <p>
              若你希望删除你提交的内容或提出隐私相关请求，请通过站内引导的联系方式联系我们。我们会在合理范围内协助处理。
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
