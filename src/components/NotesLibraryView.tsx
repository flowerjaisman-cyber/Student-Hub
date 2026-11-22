import { useEffect, useState } from 'react';
import { BookOpen, FileUp, Download, Trash2, Plus, Search, Save } from 'lucide-react';
import { localDb } from '../lib/localDb.ts';

type Note = { id:string; title:string; subject:string; content:string; updatedAt:string };
type StoredFile = { id:string; name:string; type:string; size:number; subject:string; updatedAt:string };

const uid = () => crypto.randomUUID();
const stamp = () => new Date().toISOString();

export function NotesLibraryView() {
  const [notes,setNotes] = useState<Note[]>([]);
  const [files,setFiles] = useState<StoredFile[]>([]);
  const [title,setTitle] = useState('');
  const [subject,setSubject] = useState('');
  const [content,setContent] = useState('');
  const [query,setQuery] = useState('');
  const [message,setMessage] = useState('');

  const refresh = () => {
    setNotes(localDb.getItems<Note>('library_notes','student_user',{orderByField:'updatedAt',orderDirection:'desc'}));
    setFiles(localDb.getItems<StoredFile>('library_files','student_user',{orderByField:'updatedAt',orderDirection:'desc'}));
  };
  useEffect(()=>{ refresh(); },[]);

  const saveNote = () => {
    if (!title.trim() || !content.trim()) return;
    localDb.saveItem('library_notes','student_user',{id:uid(),title:title.trim(),subject:subject.trim(),content,updatedAt:stamp()});
    setTitle(''); setSubject(''); setContent(''); refresh(); setMessage('Note saved on this device.');
  };
  const upload = async (file?:File) => {
    if (!file) return;
    if (file.size > 20*1024*1024) { setMessage('File is larger than 20 MB.'); return; }
    const id=uid();
    try {
      await localDb.saveBlob(id,file);
      localDb.saveItem('library_files','student_user',{id,name:file.name,type:file.type || 'application/octet-stream',size:file.size,subject:subject.trim(),updatedAt:stamp()});
      refresh(); setMessage('File added to your library.');
    } catch { setMessage('Could not save this file in browser storage.'); }
  };
  const download = async (file:StoredFile) => {
    const blob=await localDb.getBlob(file.id);
    if (!blob) { setMessage('File data is not available in this browser.'); return; }
    const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=file.name; a.click(); URL.revokeObjectURL(url);
  };
  const removeFile = async (file:StoredFile) => { await localDb.deleteBlob(file.id); localDb.deleteItem('library_files','student_user',file.id); refresh(); };
  const filteredNotes=notes.filter(n=>[n.title,n.subject,n.content].join(' ').toLowerCase().includes(query.toLowerCase()));
  const filteredFiles=files.filter(f=>[f.name,f.subject].join(' ').toLowerCase().includes(query.toLowerCase()));
  const input='w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500';

  return <div className="max-w-6xl mx-auto space-y-6 pb-12">
    <header><p className="text-xs font-semibold text-indigo-600">STUDENT WORKSPACE</p><h1 className="text-2xl sm:text-3xl font-extrabold mt-1">Notes &amp; PDF Library</h1><p className="text-sm text-slate-500 mt-1">Create subject notes and keep study files together on this device.</p></header>
    {message && <p role="status" className="text-sm rounded-xl bg-indigo-50 dark:bg-indigo-950/40 p-3 text-indigo-700 dark:text-indigo-300">{message}</p>}
    <div className="grid lg:grid-cols-2 gap-5">
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
        <h2 className="font-bold flex items-center gap-2"><Plus className="w-4 h-4"/> Create a note</h2>
        <input className={input} placeholder="Note title" value={title} onChange={e=>setTitle(e.target.value)}/>
        <input className={input} placeholder="Subject / course (optional)" value={subject} onChange={e=>setSubject(e.target.value)}/>
        <textarea className={input+' min-h-40'} placeholder="Write your lecture notes, key points or revision material..." value={content} onChange={e=>setContent(e.target.value)}/>
        <button onClick={saveNote} disabled={!title.trim() || !content.trim()} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"><Save className="w-4 h-4"/> Save note</button>
      </section>
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
        <h2 className="font-bold flex items-center gap-2"><FileUp className="w-4 h-4"/> Add study files</h2>
        <p className="text-sm text-slate-500">Upload PDF, Word, PowerPoint, images or other course files (max 20 MB each).</p>
        <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400">
          <FileUp className="w-7 h-7 text-indigo-500"/><span className="text-sm font-semibold">Choose files from device</span><span className="text-xs text-slate-500">Files stay in this browser</span>
          <input type="file" multiple className="sr-only" onChange={e=>{Array.from(e.target.files||[]).forEach(f=>void upload(f));e.currentTarget.value='';}}/>
        </label>
        <div className="text-xs text-slate-500">Storage depends on your browser's available space. Download important files as backup.</div>
      </section>
    </div>
    <div className="relative"><Search className="absolute left-3 top-3 w-4 h-4 text-slate-400"/><input className={input+' pl-9'} placeholder="Search notes and files..." value={query} onChange={e=>setQuery(e.target.value)}/></div>
    <div className="grid lg:grid-cols-2 gap-5">
      <section className="space-y-3"><h2 className="font-bold flex items-center gap-2"><BookOpen className="w-4 h-4"/> Saved notes ({filteredNotes.length})</h2>
        {filteredNotes.map(n=><article key={n.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"><div className="flex justify-between gap-3"><div><h3 className="font-semibold">{n.title}</h3><p className="text-xs text-indigo-500 mt-1">{n.subject || 'General'} · {new Date(n.updatedAt).toLocaleDateString()}</p></div><button aria-label="Delete note" onClick={()=>{localDb.deleteItem('library_notes','student_user',n.id);refresh();}} className="text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4"/></button></div><p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap mt-3 line-clamp-5">{n.content}</p></article>)}
        {!filteredNotes.length && <p className="text-sm text-slate-500 rounded-xl border border-dashed p-5">No notes yet. Create your first note above.</p>}
      </section>
      <section className="space-y-3"><h2 className="font-bold flex items-center gap-2"><FileUp className="w-4 h-4"/> Saved files ({filteredFiles.length})</h2>
        {filteredFiles.map(f=><article key={f.id} className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3"><div className="min-w-0 flex-1"><h3 className="text-sm font-semibold truncate">{f.name}</h3><p className="text-xs text-slate-500">{f.subject || 'General'} · {(f.size/1024/1024).toFixed(2)} MB</p></div><button onClick={()=>void download(f)} aria-label="Download file" className="p-2 text-indigo-600"><Download className="w-4 h-4"/></button><button onClick={()=>void removeFile(f)} aria-label="Delete file" className="p-2 text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4"/></button></article>)}
        {!filteredFiles.length && <p className="text-sm text-slate-500 rounded-xl border border-dashed p-5">No files uploaded yet.</p>}
      </section>
    </div>
  </div>;
}
