import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function ResetPasswordPage() {
  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
        <CardDescription>
          Password reset links are not supported in this version. Please contact your administrator.
        </CardDescription>
      </CardHeader>
      <CardContent />
      <CardFooter>
        <Link href="/login" className="w-full">
          <Button variant="outline" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
