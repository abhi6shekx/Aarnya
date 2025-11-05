import { useAuth } from '../lib/auth'
import { Link } from 'react-router-dom'

export default function Account(){
  const { user } = useAuth()
  if (!user) return <p>Please <Link to="/login" className="underline">login</Link>.</p>
  return (
    <div className="card p-6">
      <h1 className="h2">Account</h1>
      <p className="text-muted">Email: {user.email}</p>
      <div className="mt-4 flex gap-3">
        <Link to="/addresses" className="btn-outline rounded-full px-5 py-2">Manage Addresses</Link>
        <Link to="/products" className="btn-primary rounded-full px-5 py-2">Shop Now</Link>
      </div>
    </div>
  )
}
