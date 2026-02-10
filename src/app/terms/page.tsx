import Link from 'next/link'

export const metadata = {
  title: '用户协议 | 月见',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-black">用户协议</h1>
          <Link href="/" className="text-slate-500 text-sm hover:text-slate-900">
            返回首页
          </Link>
        </div>

        <div className="glass-card p-6 text-sm text-slate-700 space-y-4 leading-7">
          <p className="text-slate-500">生效日期：{new Date().toLocaleDateString('zh-CN')}</p>

          <section className="space-y-2">
            <h2 className="text-slate-900 font-bold">1. 服务性质</h2>
            <p>
              本站提供的“情感分析/塔罗解读/运势建议/文案改写”等内容，仅供参考与娱乐/信息辅助之用，
              不构成法律、医疗、心理治疗、投资等专业意见。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-slate-900 font-bold">2. 你不得做的事情</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>上传或传播违法、侵权、隐私敏感内容。</li>
              <li>未经他人同意处理他人聊天记录/隐私信息。</li>
              <li>通过自动化脚本、刷接口等方式滥用服务。</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-slate-900 font-bold">3. 付费与交付</h2>
            <p>
              若你购买付费功能，我们将向你提供对应的解锁/使用权限。不同产品的交付方式可能包括：解锁码、页面权限、或其他方式。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-slate-900 font-bold">4. 退款说明</h2>
            <p>
              由于本服务包含即时生成/可复制的数字化内容，一旦完成生成或完成解锁，原则上不支持无理由退款。
              若出现重复扣款、未交付等问题，请通过站内指引联系我们处理。
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-slate-900 font-bold">5. 免责声明</h2>
            <p>
              你理解并同意：AI 可能产生不准确或不完整的输出；你应基于自己的判断做决定并承担后果。
              我们不对因使用本站内容而产生的任何损失承担责任。
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
