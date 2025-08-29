//import PaymentSuccess from '@/components/payment/PaymentSuccess';


export default async function Page(
  { searchParams }: { searchParams: Promise<{ checkoutId?: string; session_id?: string }> }
) {
  const sp = await searchParams;
  const id = sp.checkoutId ?? sp.session_id;
//  return <PaymentSuccess checkoutId={id} />;
}
