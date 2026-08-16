const SUPABASE_URL = 'https://nbsmkxarkpesjiftmbwm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_dMXeVPXD_oU5NrdV2-sSew_CZxB5lFI';
const ADMIN_EMAIL = 'taufikzainalmutakin@gmail.com';
const ACCESS_COOKIE = 'tmd_admin_access';
const REFRESH_COOKIE = 'tmd_admin_refresh';

function parseCookies(request) {
  const raw = request.headers.get('Cookie') || '';
  const out = {};
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}
function cookie(name, value, maxAge) { return `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=Lax`; }
function clearCookie(name) { return `${name}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`; }
function redirectToLogin(request) { const url = new URL(request.url); const next = encodeURIComponent(url.pathname + url.search); return new Response(null,{status:302,headers:{Location:`/admin.html?next=${next}`,'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}}); }
async function getAdminUser(accessToken) {
  if (!accessToken) return null;
  const authResponse=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${accessToken}`}});
  if(!authResponse.ok)return null;
  const user=await authResponse.json();
  if(!user?.id||user.email?.toLowerCase()!==ADMIN_EMAIL.toLowerCase())return null;
  const profileResponse=await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=role&id=eq.${encodeURIComponent(user.id)}&limit=1`,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${accessToken}`}});
  if(!profileResponse.ok)return null;
  const profiles=await profileResponse.json();
  return profiles?.[0]?.role==='admin'?user:null;
}
async function refreshSession(refreshToken){
  if(!refreshToken)return null;
  const response=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,{method:'POST',headers:{apikey:SUPABASE_KEY,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({refresh_token:refreshToken})});
  if(!response.ok)return null;
  const data=await response.json();
  if(!data?.access_token||!data?.refresh_token)return null;
  return await getAdminUser(data.access_token)?data:null;
}
async function createAdminSession(request){
  const authorization=request.headers.get('Authorization')||'';const token=authorization.startsWith('Bearer ')?authorization.slice(7).trim():'';const refreshToken=request.headers.get('X-Admin-Refresh-Token')||'';const user=await getAdminUser(token);
  if(!user||!refreshToken)return new Response(JSON.stringify({ok:false,error:'Unauthorized'}),{status:401,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
  const response=new Response(JSON.stringify({ok:true,email:user.email}),{status:200,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});response.headers.append('Set-Cookie',cookie(ACCESS_COOKIE,token,3600));response.headers.append('Set-Cookie',cookie(REFRESH_COOKIE,refreshToken,60*60*24*30));return response;
}
function clearAdminSession(){const response=new Response(JSON.stringify({ok:true}),{status:200,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});response.headers.append('Set-Cookie',clearCookie(ACCESS_COOKIE));response.headers.append('Set-Cookie',clearCookie(REFRESH_COOKIE));return response;}
async function protectAdminPage(request,env){
  const cookies=parseCookies(request);let accessToken=cookies[ACCESS_COOKIE];let refreshToken=cookies[REFRESH_COOKIE];let refreshed=null;let user=await getAdminUser(accessToken);
  if(!user&&refreshToken){refreshed=await refreshSession(refreshToken);if(refreshed){accessToken=refreshed.access_token;refreshToken=refreshed.refresh_token;user=await getAdminUser(accessToken)}}
  if(!user)return redirectToLogin(request);
  const response=await env.ASSETS.fetch(request);const type=response.headers.get('content-type')||'';if(!type.includes('text/html'))return response;
  const headers=new Headers(response.headers);headers.set('Content-Type','text/html; charset=UTF-8');headers.set('Cache-Control','private, no-store, max-age=0, must-revalidate');
  if(refreshed){headers.append('Set-Cookie',cookie(ACCESS_COOKIE,accessToken,3600));headers.append('Set-Cookie',cookie(REFRESH_COOKIE,refreshToken,60*60*24*30));}
  const url=new URL(request.url);
  if(url.pathname.startsWith('/admin-dashboard')){
    const html=await response.text();let injected=html;
    if(!injected.includes('admin-motor-catalog-hotfix.js'))injected=injected.replace(/<\/body>/i,'<script src="./admin-motor-catalog-hotfix.js?v=20260816-catalog2"></script>\n</body>');
    if(!injected.includes('admin-income-payment-edit-hotfix.js'))injected=injected.replace(/<\/body>/i,'<script src="./admin-income-payment-edit-hotfix.js?v=20260816-income5"></script>\n</body>');
    if(!injected.includes('admin-income-compat-hotfix.js'))injected=injected.replace(/<\/body>/i,'<script src="./admin-income-compat-hotfix.js?v=20260816-income3"></script>\n</body>');
    if(!injected.includes('admin-income-payment-layout-hotfix.js'))injected=injected.replace(/<\/body>/i,'<script src="./admin-income-payment-layout-hotfix.js?v=20260816-income4"></script>\n</body>');
    return new Response(injected,{status:response.status,statusText:response.statusText,headers});
  }
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
async function servePublic(request,env){
  const response=await env.ASSETS.fetch(request);const type=response.headers.get('content-type')||'';const url=new URL(request.url);if(!type.includes('text/html')||url.pathname.startsWith('/admin'))return response;
  const headers=new Headers(response.headers);headers.set('Content-Type','text/html; charset=UTF-8');headers.set('Cache-Control','no-store, max-age=0, must-revalidate');
  if(url.pathname==='/'||url.pathname==='/index.html'){const html=await response.text();if(!html.includes('public-sync-v3.js')){const injected=html.replace(/<\/body>/i,'<script src="./public-sync-v3.js"></script>\n</body>');return new Response(injected,{status:response.status,statusText:response.statusText,headers})}return new Response(html,{status:response.status,statusText:response.statusText,headers})}
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
export default{async fetch(request,env){const url=new URL(request.url);if(url.pathname==='/api/admin-session'){if(request.method==='POST')return createAdminSession(request);if(request.method==='DELETE')return clearAdminSession();return new Response('Method Not Allowed',{status:405})}const protectedAdmin=url.pathname==='/admin-dashboard'||url.pathname==='/admin-dashboard.html'||url.pathname.startsWith('/admin-dashboard-')||url.pathname.startsWith('/admin-dashboard/');if(protectedAdmin)return protectAdminPage(request,env);return servePublic(request,env)}};
