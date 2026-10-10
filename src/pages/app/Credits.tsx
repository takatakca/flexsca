import { Link } from 'react-router-dom';
import WalletCard from '@/components/WalletCard';
export default function Credits(){
  return <div className="max-w-3xl mx-auto p-5 md:p-8 space-y-5"><Link to="/app/settings" className="text-sm text-primary">Back to Settings</Link><h2 className="text-2xl font-bold">Your credits</h2><p className="text-sm text-muted-foreground">Use credits to unlock customer contact details. Packages are priced in Canadian dollars. Your balance changes only after payment is confirmed.</p><WalletCard /></div>;
}
