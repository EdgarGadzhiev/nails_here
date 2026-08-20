(function(){
  const SUPABASE_URL='https://smtufbilfcszuhywswmx.supabase.co';
  const SUPABASE_ANON_KEY=['sb_publishable_o','-blKCBreqQQDzolb9IMCQ_U9Ila5KH'].join('');
  const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
  let names=new Map();
  let lastSync=0;

  async function syncNames(){
    try{
      const now=Date.now();
      if(now-lastSync<1000)return;
      lastSync=now;
      const {data,error}=await client.rpc('get_manageable_users');
      if(error||!Array.isArray(data))return;
      names=new Map(data.map(u=>[String(u.id),{name:(u.display_name||'').trim(),email:(u.email||'').trim()}]));
      applyNames();
    }catch(e){console.error('force-name-display:',e)}
  }

  function applyNames(){
    document.querySelectorAll('#peopleList .person-row').forEach(row=>{
      const button=row.querySelector('[data-delete-admin],[data-delete-owner]');
      const id=button?.getAttribute('data-delete-admin')||button?.getAttribute('data-delete-owner');
      if(!id)return;
      const person=names.get(String(id));
      if(!person||!person.name)return;
      const box=row.querySelector(':scope > div');
      const strong=box?.querySelector('strong');
      if(!box||!strong)return;
      strong.textContent=person.name;
      strong.setAttribute('title',person.email);
      let email=box.querySelector('.forced-person-email');
      if(!email){
        email=document.createElement('div');
        email.className='forced-person-email';
        email.style.cssText='font-size:12px;opacity:.65;margin-top:2px;line-height:1.3;';
        box.appendChild(email);
      }
      email.textContent=person.email;
    });
  }

  const observer=new MutationObserver(()=>{applyNames();});
  function start(){
    const list=document.getElementById('peopleList');
    if(list)observer.observe(list,{childList:true,subtree:true});
    syncNames();
    setTimeout(syncNames,1500);
    setTimeout(syncNames,3000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
