import Link from 'next/link'

export const metadata = {
  title: '用户协议 | 月见',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">用户协议</h1>
          <Link href="/" className="text-sm text-slate-500 transition hover:text-slate-900">返回首页</Link>
        </div>

        <div className="glass-card space-y-4 p-6 text-sm leading-7 text-slate-700">
          <p className="text-slate-500">生效日期：{new Date().toLocaleDateString('zh-CN')}</p>

          <section>
            <h2 className="font-semibold text-slate-900">1. 服务性质</h2>
            <p className="mt-1">
              本站输出内容用于参考与信息辅助，不构成法律、医疗、心理治疗或投资建议。
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900">2. 使用规范</h2>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>不得上传违法、侵权或未经授权的内容。</li>
              <li>不得通过自动化手段滥用接口或攻击服务。</li>
              <li>不得利用本服务实施诈骗、骚扰或其他违法行为。</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900">3. 付费与交付</h2>
            <p className="mt-1">
              付费功能将以页面展示的方式交付（如解锁权限、功能次数、专属结果等）。
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-slate-900">4. 免责与限制</h2>
            <p className="mt-1">
              你理解并同意：AI 可能出现不准确或不完整输出，最终决策需由你自行判断并承担后果。
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
