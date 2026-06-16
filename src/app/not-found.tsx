import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="text-2xl font-bold text-cohort-charcoal">페이지를 찾을 수 없어요</h1>
      <p className="mt-3 text-sm text-cohort-ink-50 break-keep">
        주소가 바뀌었거나 더 이상 제공하지 않는 페이지일 수 있어요.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex min-h-[44px] items-center rounded-xl bg-cohort-primary px-6 text-base font-semibold text-cohort-ivory"
      >
        홈으로
      </Link>
    </main>
  );
}
