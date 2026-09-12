import { useEffect,useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { api } from './client';
interface Member {id:string;name:string;email:string;role:string;active:boolean;must_change_password:boolean;}
export function UsersPanel(){
  const [users,setUsers]=useState<Member[]>([]);const [error,setError]=useState('');const [notice,setNotice]=useState('');const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(true);const [loadError,setLoadError]=useState('');
  const load=async()=>{setLoading(true);setLoadError('');try{setUsers((await api('/api/users')).users);}catch(e){setLoadError((e as Error).message);}finally{setLoading(false);}};
  useEffect(()=>{void load();},[]);
  return <div className="h-full overflow-y-auto bg-gray-50 p-6"><div className="mx-auto max-w-4xl space-y-6">
    <div><h1 className="text-xl font-bold">Team access</h1><p className="mt-1 text-sm text-gray-500">Manage accounts within your organization. Role, access, and password changes revoke that user’s sessions.</p></div>
    {error&&<p role="alert" className="rounded bg-red-50 p-3 text-red-700">{error}</p>}{notice&&<p role="status" className="rounded bg-green-50 p-3 text-green-800">{notice}</p>}
    <form className="grid gap-3 rounded-xl border bg-white p-5 sm:grid-cols-2" onSubmit={async event=>{
      event.preventDefault();const form=event.currentTarget;const data=new FormData(form);setBusy(true);setError('');setNotice('');
      try{await api('/api/users',Object.fromEntries(data));form.reset();setNotice('Account created. Share the temporary password privately; the user must change it on first sign-in.');await load();}
      catch(e){setError((e as Error).message);}finally{setBusy(false);}
    }}>
      <h2 className="font-semibold sm:col-span-2">Add user</h2>
      <label className="text-sm">Name<input id="new-user-name" required name="name" maxLength={100} className="mt-1 w-full rounded border p-2" /></label>
      <label className="text-sm">Email<input required type="email" name="email" className="mt-1 w-full rounded border p-2" /></label>
      <label className="text-sm">Role<select name="role" className="mt-1 w-full rounded border p-2"><option value="member">Member</option><option value="reviewer">Reviewer</option><option value="admin">Admin</option></select></label>
      <label className="text-sm">Temporary password<input required minLength={12} maxLength={256} type="password" name="password" autoComplete="new-password" className="mt-1 w-full rounded border p-2" /></label>
      <button disabled={busy} className="rounded bg-red-600 px-4 py-2 text-white disabled:opacity-50">Create account</button>
    </form>
    {loading&&<p role="status" className="text-sm text-gray-500">Loading team members…</p>}
    {loadError&&<EmptyState title="Team members couldn’t be loaded" description="Your accounts haven’t changed. Try loading the list again." action={<button type="button" disabled={loading} onClick={()=>void load()}>Try again</button>}/>}
    {!loading&&!loadError&&!users.length&&<EmptyState title="No team members yet" description="Add an account so a teammate can sign in to this workspace." action={<button type="button" onClick={()=>document.getElementById('new-user-name')?.focus()}>Add a teammate</button>}/>}
    <div className="space-y-3">{users.map(user=><form key={`${user.id}-${user.role}-${user.active}`} className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4" onSubmit={async event=>{
      event.preventDefault();const data=new FormData(event.currentTarget);setBusy(true);setError('');setNotice('');
      try{await api(`/api/users/${user.id}`,{role:data.get('role'),active:data.get('active')==='true',...(data.get('password')?{password:data.get('password')}:{})},'PATCH');setNotice('Access updated. Existing sessions were revoked.');await load();}
      catch(e){setError((e as Error).message);}finally{setBusy(false);}
    }}><div className="min-w-48 flex-1"><div className="font-medium">{user.name}</div><div className="text-sm text-gray-500">{user.email}</div>{user.must_change_password&&<div className="text-xs text-amber-700">Password change required</div>}</div>
      <label className="text-xs">Role<select aria-label={`Role for ${user.email}`} name="role" defaultValue={user.role} className="mt-1 block rounded border p-2"><option value="member">Member</option><option value="reviewer">Reviewer</option><option value="admin">Admin</option></select></label>
      <label className="text-xs">Access<select aria-label={`Access for ${user.email}`} name="active" defaultValue={String(user.active)} className="mt-1 block rounded border p-2"><option value="true">Active</option><option value="false">Disabled</option></select></label>
      <label className="text-xs">Reset password (optional)<input aria-label={`Reset password for ${user.email}`} name="password" type="password" minLength={12} autoComplete="new-password" className="mt-1 block w-44 rounded border p-2" /></label>
      <button disabled={busy} className="rounded border px-3 py-2 text-sm disabled:opacity-50">Save access</button>
    </form>)}</div>
  </div></div>;
}
