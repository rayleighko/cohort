/**
 * Waitlist confirmation email — Aurora tone, Option B strict.
 * Plain inline-styled HTML (React Email overhead is out of the Day 5b cap).
 */

export function waitlistConfirmationEmail(): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = 'Cohort 사전 신청이 완료됐어요 🕊';

  const text = [
    '본인 plan과 cohort, 흔들리지 않는 페이스.',
    '',
    'Cohort 사전 신청이 완료됐어요. Launch 소식을 가장 먼저 전해드릴게요.',
    '— Aurora 🕊 + Vesper 🦅 드림',
    '',
    '본 서비스는 정보 제공 + 의사결정 지원 도구이며, 투자 자문 서비스가 아닙니다.',
    '모든 투자 결정과 손익은 사용자 본인의 책임입니다.',
    '수신 거부는 곧 출시되는 설정 페이지에서 가능합니다.',
  ].join('\n');

  const html = `<!doctype html>
<html lang="ko">
  <body style="margin:0;padding:0;background-color:#F8F4ED;font-family:'Pretendard',system-ui,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8F4ED;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background-color:#ffffff;border-radius:12px;padding:32px;">
            <tr>
              <td style="font-size:18px;font-weight:700;color:#A8243F;padding-bottom:20px;">
                Cohort
              </td>
            </tr>
            <tr>
              <td style="font-size:20px;font-weight:700;color:#1A1A1A;line-height:1.45;word-break:keep-all;padding-bottom:16px;">
                본인 plan과 cohort,<br />흔들리지 않는 페이스.
              </td>
            </tr>
            <tr>
              <td style="font-size:15px;color:#404040;line-height:1.6;word-break:keep-all;padding-bottom:8px;">
                Cohort 사전 신청이 완료됐어요. Launch 소식을 가장 먼저
                전해드릴게요.
              </td>
            </tr>
            <tr>
              <td style="font-size:15px;color:#404040;line-height:1.6;padding-bottom:24px;">
                — Aurora 🕊 + Vesper 🦅 드림
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid #E0E0E0;padding-top:16px;font-size:12px;color:#7A7A7A;line-height:1.6;word-break:keep-all;">
                본 서비스는 정보 제공 + 의사결정 지원 도구이며, 투자 자문
                서비스가 아닙니다. 모든 투자 결정과 손익은 사용자 본인의
                책임입니다.<br /><br />
                수신 거부는 곧 출시되는 설정 페이지에서 가능합니다.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}
