import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ReservationCompletePage() {
  return (
    <div className="container max-w-2xl mx-auto py-16 px-4">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">ご予約ありがとうございます</h1>
          <p className="text-muted-foreground">
            予約の確認メールをお送りしましたので、ご確認ください。
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm text-left space-y-4">
          <p>
            ご予約内容の詳細は、ご登録いただいたメールアドレスに送信されます。
            メールが届かない場合は、お手数ですがお問い合わせください。
          </p>
          
          <div className="space-y-2">
            <h2 className="font-semibold">ご注意事項</h2>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>ご予約時間の10分前までにお越しください。</li>
              <li>キャンセルは予約時間の24時間前までにご連絡ください。</li>
              <li>当日のキャンセルは、キャンセル料が発生する場合があります。</li>
            </ul>
          </div>
        </div>

        <div className="pt-4">
          <Link href="/">
            <Button>
              トップページに戻る
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
} 