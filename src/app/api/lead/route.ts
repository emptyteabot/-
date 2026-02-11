import { NextRequest, NextResponse } from 'next/server'

type LeadIntent = 'trial' | 'purchase' | 'agent' | 'other'

function getIp(req: NextRequest): string {
  const cf = req.headers.get('cf-connecting-ip')
  if (cf) return cf.trim()
  const real = req.headers.get('x-real-ip')
  if (real) return real.trim()
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return 'unknown'
}

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const contact = String(body?.contact || '').trim()
    const channel = String(body?.channel || '').trim()
    const note = String(body?.note || '').trim().slice(0, 600)
    const intent = (String(body?.intent || 'trial').trim() || 'trial') as LeadIntent

    if (!contact || contact.length < 4 || contact.length > 120) {
      return bad('请填写有效联系方式（微信/手机号/邮箱）')
    }
    if (channel && channel.length > 40) {
      return bad('渠道字段过长')
    }
    if (!['trial', 'purchase', 'agent', 'other'].includes(intent)) {
      return bad('意向类型无效')
    }

    const leadId = `lead_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
    const payload = {
      leadId,
      contact,
      channel: channel || 'direct',
      intent,
      note,
      page: body?.page || '/',
      createdAt: new Date().toISOString(),
      ip: getIp(req),
      userAgent: req.headers.get('user-agent') || 'unknown',
    }

    const webhook = process.env.LEAD_WEBHOOK_URL
    if (webhook) {
      const r = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!r.ok) {
        const text = await r.text().catch(() => '')
        return bad(`线索保存失败: webhook ${r.status}${text ? ` ${text.slice(0, 120)}` : ''}`, 502)
      }
    } else {
      // Fallback for early stage: no webhook configured yet.
      console.log('[LEAD_CAPTURE]', payload)
    }

    return NextResponse.json({ ok: true, leadId })
  } catch (err: any) {
    return bad(err?.message || '线索提交失败', 500)
  }
}
