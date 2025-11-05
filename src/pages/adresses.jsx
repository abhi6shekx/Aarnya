import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { db } from '../lib/firebase'
import { collection, addDoc, getDocs, query, where, doc, updateDoc } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'

export default function Addresses(){
  const { user } = useAuth()
  const nav = useNavigate()
  const [list, setList] = useState([])
  const [f, setF] = useState({ name:'', phone:'', line1:'', line2:'', city:'', state:'', pincode:'', landmark:'', isDefault:false })
  const [err, setErr] = useState('')

  useEffect(()=>{
    if (!user) { nav('/login'); return }
    (async ()=>{
      const snap = await getDocs(collection(db,'users',user.uid,'addresses'))
      setList(snap.docs.map(d=>({id:d.id, ...d.data()})))
    })()
  }, [user])

  const save = async ()=>{
    setErr('')
    if (!f.name || !f.phone || !f.line1 || !f.city || !f.state || !f.pincode) { setErr('Fill required fields'); return }
    const ref = await addDoc(collection(db,'users',user.uid,'addresses'), f)
    if (f.isDefault) {
      // unset other defaults
      const snap = await getDocs(collection(db,'users',user.uid,'addresses'))
      await Promise.all(snap.docs.map(d => d.id===ref.id ? null : updateDoc(doc(db,'users',user.uid,'addresses',d.id), { isDefault:false })))
    }
    setF({ name:'', phone:'', line1:'', line2:'', city:'', state:'', pincode:'', landmark:'', isDefault:false })
    const snap2 = await getDocs(collection(db,'users',user.uid,'addresses'))
    setList(snap2.docs.map(d=>({id:d.id, ...d.data()})))
  }

  const setDefault = async(id)=>{
    await Promise.all(list.map(a => updateDoc(doc(db,'users',user.uid,'addresses',a.id), { isDefault: a.id===id })))
    const snap = await getDocs(collection(db,'users',user.uid,'addresses'))
    setList(snap.docs.map(d=>({id:d.id, ...d.data()})))
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card p-6 space-y-3">
        <h2 className="h2">Add Address</h2>
        {err && <p className="text-red-600 text-sm">{err}</p>}
        {['name','phone','line1','line2','city','state','pincode','landmark'].map(k=>(
          <input key={k} className="w-full border border-blush-300 rounded-xl p-2.5" placeholder={k.toUpperCase()} value={f[k]} onChange={e=>setF({...f,[k]:e.target.value})} />
        ))}
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.isDefault} onChange={e=>setF({...f,isDefault:e.target.checked})}/> Set as default</label>
        <button className="btn-primary rounded-full px-6 py-3" onClick={save}>Save Address</button>
      </div>

      <div className="card p-6">
        <h2 className="h2 mb-3">Saved Addresses</h2>
        {!list.length && <p className="text-muted">No addresses yet.</p>}
        <div className="space-y-3">
          {list.map(a=>(
            <div key={a.id} className={`p-4 rounded-xl border ${a.isDefault?'border-rose-500':'border-blush-200'}`}>
              <p className="font-medium">{a.name} • {a.phone}</p>
              <p className="text-sm">{a.line1}, {a.line2}</p>
              <p className="text-sm">{a.city}, {a.state} - {a.pincode}</p>
              {a.landmark && <p className="text-sm">Landmark: {a.landmark}</p>}
              {!a.isDefault && <button className="btn-outline mt-2 rounded-full px-4 py-1.5" onClick={()=>setDefault(a.id)}>Make Default</button>}
              {a.isDefault && <span className="text-xs text-rose-600">Default</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
