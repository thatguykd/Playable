import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const SUPABASE_URL = 'https://fmvtuvlgmkdzfhjkqzqq.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_rcDLkBY5kKra9knfoZ6xlg_n-2T5n_C';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Read the migration file
const migrationPath = path.join(__dirname, 'supabase', 'migrations', '002_seed_demo_games.sql');
const sql = fs.readFileSync(migrationPath, 'utf8');

console.log('Running migration: 002_seed_demo_games.sql');
console.log('---');

try {
  // Execute the SQL
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    // RPC might not exist, try direct insert instead
    console.log('Using direct insert method...');

    // Insert Neon Drift
    const { data: neonData, error: neonError } = await supabase
      .from('games')
      .insert({
        id: '00000000-0000-0000-0000-000000000001',
        title: 'Neon Drift',
        description: 'A high-speed survival game where you dodge obstacles in a cyberpunk tunnel. The speed increases every 10 seconds.',
        author_id: null,
        author_name: 'Playable Studios',
        html: `<!DOCTYPE html><html><body style="margin:0;overflow:hidden;background:#000"><canvas id="c"></canvas><script>const c=document.getElementById('c');const x=c.getContext('2d');c.width=window.innerWidth;c.height=window.innerHeight;let p={x:c.width/2,y:c.height-50,w:30,h:30},obs=[],sc=0,go=false;window.onresize=()=>{c.width=window.innerWidth;c.height=window.innerHeight;p.x=c.width/2;};document.onmousemove=e=>p.x=e.clientX;setTimeout(()=>{window.parent.postMessage({type:'SCREENSHOT',image:c.toDataURL('image/jpeg',0.5)},'*')},2000);function l(){if(go)return;requestAnimationFrame(l);x.fillStyle='rgba(0,0,0,0.3)';x.fillRect(0,0,c.width,c.height);if(Math.random()<0.05)obs.push({x:Math.random()*c.width,y:-50,s:5+sc/100});x.fillStyle='#0ff';x.shadowBlur=20;x.shadowColor='#0ff';x.fillRect(p.x-p.w/2,p.y,p.w,p.h);x.shadowBlur=0;x.fillStyle='#f0f';obs.forEach((o,i)=>{o.y+=o.s;x.fillRect(o.x,o.y,20,20);if(o.y>c.height){obs.splice(i,1);sc+=10;}if(Math.abs(o.x-p.x)<25&&Math.abs(o.y-p.y)<25){go=true;window.parent.postMessage({type:'GAME_OVER',score:sc},'*');x.fillStyle='#fff';x.font='30px monospace';x.fillText('CRASHED',c.width/2-60,c.height/2);}});x.fillStyle='#fff';x.font='20px monospace';x.fillText('SCORE: '+sc,20,40);}l();</script></body></html>`,
        thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop',
        category: 'Action',
        plays: 8420,
        is_official: true,
        created_at: new Date(Date.now() - 115 * 24 * 60 * 60 * 1000).toISOString()
      });

    if (neonError) {
      console.error('Error inserting Neon Drift:', neonError);
    } else {
      console.log('✓ Neon Drift inserted successfully');
    }

    // Insert Quantum Pong
    const { data: pongData, error: pongError } = await supabase
      .from('games')
      .insert({
        id: '00000000-0000-0000-0000-000000000002',
        title: 'Quantum Pong',
        description: 'Classic pong with a physics twist. The ball splits when it hits a wall.',
        author_id: null,
        author_name: 'Playable Studios',
        html: `<!DOCTYPE html><html><body style="margin:0;overflow:hidden;background:#111"><canvas id="c"></canvas><script>const c=document.getElementById('c');const x=c.getContext('2d');c.width=window.innerWidth;c.height=window.innerHeight;let p1={x:50,y:c.height/2,w:15,h:80,s:0};let p2={x:c.width-65,y:c.height/2,w:15,h:80,s:5};let balls=[{x:c.width/2,y:c.height/2,vx:5,vy:3,r:8}];let sc1=0,sc2=0,go=false;window.onresize=()=>{c.width=window.innerWidth;c.height=window.innerHeight;p1.y=c.height/2;p2.x=c.width-65;p2.y=c.height/2;};document.onmousemove=e=>p1.y=e.clientY;setTimeout(()=>{window.parent.postMessage({type:'SCREENSHOT',image:c.toDataURL('image/jpeg',0.5)},'*')},2000);function loop(){if(go)return;requestAnimationFrame(loop);x.fillStyle='rgba(17,17,17,0.2)';x.fillRect(0,0,c.width,c.height);x.strokeStyle='rgba(0,255,255,0.2)';x.lineWidth=2;x.setLineDash([10,10]);x.beginPath();x.moveTo(c.width/2,0);x.lineTo(c.width/2,c.height);x.stroke();x.setLineDash([]);x.shadowBlur=20;x.shadowColor='#0ff';x.fillStyle='#0ff';x.fillRect(p1.x,p1.y-p1.h/2,p1.w,p1.h);x.shadowColor='#f0f';x.fillStyle='#f0f';x.fillRect(p2.x,p2.y-p2.h/2,p2.w,p2.h);x.shadowBlur=0;balls.forEach((b,i)=>{b.x+=b.vx;b.y+=b.vy;if(b.y-b.r<0||b.y+b.r>c.height){b.vy*=-1;b.y=b.y<c.height/2?b.r:c.height-b.r;if(balls.length<8){balls.push({x:b.x,y:b.y,vx:b.vx*0.8,vy:-b.vy*1.2,r:b.r*0.9});balls.push({x:b.x,y:b.y,vx:b.vx*1.2,vy:-b.vy*0.8,r:b.r*0.9});balls.splice(i,1);return;}}if(b.x-b.r<p1.x+p1.w&&b.y>p1.y-p1.h/2&&b.y<p1.y+p1.h/2){b.vx=Math.abs(b.vx);b.x=p1.x+p1.w+b.r;}if(b.x+b.r>p2.x&&b.y>p2.y-p2.h/2&&b.y<p2.y+p2.h/2){b.vx=-Math.abs(b.vx);b.x=p2.x-b.r;}if(b.x<0){sc2++;balls.splice(i,1);if(balls.length===0){balls=[{x:c.width/2,y:c.height/2,vx:-5,vy:3,r:8}];}}if(b.x>c.width){sc1++;balls.splice(i,1);if(balls.length===0){balls=[{x:c.width/2,y:c.height/2,vx:5,vy:-3,r:8}];}}x.shadowBlur=15;x.shadowColor='#fff';x.fillStyle='#fff';x.beginPath();x.arc(b.x,b.y,b.r,0,Math.PI*2);x.fill();});x.shadowBlur=0;if(balls.length>0){let target=balls[0];if(p2.y<target.y)p2.y+=p2.s;if(p2.y>target.y)p2.y-=p2.s;}x.fillStyle='rgba(0,255,255,0.7)';x.font='40px monospace';x.fillText(sc1,c.width/2-60,50);x.fillStyle='rgba(255,0,255,0.7)';x.fillText(sc2,c.width/2+40,50);if(sc1>=5||sc2>=5){go=true;window.parent.postMessage({type:'GAME_OVER',score:sc1},'*');x.fillStyle='#fff';x.font='50px monospace';const msg=sc1>=5?'YOU WIN!':'AI WINS!';x.fillText(msg,c.width/2-150,c.height/2);}}loop();</script></body></html>`,
        thumbnail: 'https://images.unsplash.com/photo-1614294149010-950b698f72c0?q=80&w=2000&auto=format&fit=crop',
        category: 'Arcade',
        plays: 3201,
        is_official: true,
        created_at: new Date(Date.now() - 57 * 24 * 60 * 60 * 1000).toISOString()
      });

    if (pongError) {
      console.error('Error inserting Quantum Pong:', pongError);
    } else {
      console.log('✓ Quantum Pong inserted successfully');
    }

    if (!neonError && !pongError) {
      console.log('\n✓ Migration completed successfully!');
      console.log('Both demo games have been added to your database.');
    }
  } else {
    console.log('✓ Migration completed successfully!');
  }
} catch (err) {
  console.error('Migration failed:', err);
  process.exit(1);
}
