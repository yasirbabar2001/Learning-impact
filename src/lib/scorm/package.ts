import "server-only";
import { strToU8, zipSync } from "fflate";
import type { Course, Session } from "../courses/schema";

/**
 * Builds a SCORM 1.2 package for a session test. The same HTML is played inside the portal
 * (which provides the SCORM API and re-grades the answers on the server) and can be downloaded as a
 * zip for a client's own LMS.
 */

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export function quizHtml(course: Course, session: Session, passScore: number): string {
  const data = {
    title: `${session.stage}: stage test`,
    course: course.title,
    color: course.quest.color,
    pass: passScore,
    questions: session.quiz.map((q) => ({ id: q.id, q: q.question, o: q.options, a: q.answer, e: q.explanation })),
  };
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(data.title)}</title>
<style>
*{box-sizing:border-box}html,body{margin:0;min-height:100%}
body{font-family:Inter,system-ui,Segoe UI,Arial,sans-serif;background:#09090d;color:#f6f6f8;--c:${course.quest.color};
background-image:radial-gradient(circle at 15% 0%,color-mix(in srgb,var(--c) 30%,transparent),transparent 45%),radial-gradient(circle at 100% 100%,rgba(123,97,255,.25),transparent 45%)}
.wrap{max-width:760px;margin:0 auto;padding:28px 20px 40px}
.top{display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:13px;color:rgba(246,246,248,.65)}
.bar{height:6px;border-radius:6px;background:rgba(255,255,255,.1);overflow:hidden;margin:12px 0 26px}
.bar span{display:block;height:100%;width:0;background:linear-gradient(90deg,#ff4d6d,#ff9f1c,#ffd23f,#2ee59d,#00c2ff,#7b61ff);transition:width .5s cubic-bezier(.22,1,.36,1)}
h1{font-size:22px;margin:0 0 4px}.q{font-size:20px;line-height:1.45;font-weight:600;margin:0 0 20px}
.opts{display:grid;gap:10px}
.opt{display:flex;gap:12px;align-items:flex-start;text-align:left;width:100%;padding:14px 16px;border-radius:14px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.04);color:inherit;font:inherit;font-size:16px;cursor:pointer;transition:transform .25s,border-color .25s,background .25s}
.opt:hover:not(:disabled){transform:translateY(-2px);border-color:rgba(255,255,255,.4)}
.opt b{display:grid;place-items:center;flex:0 0 28px;height:28px;border-radius:8px;background:rgba(255,255,255,.1);font-size:13px}
.opt.right{border-color:#2ee59d;background:rgba(46,229,157,.14)}.opt.right b{background:#2ee59d;color:#05110b}
.opt.wrong{border-color:#ff4d6d;background:rgba(255,77,109,.14);animation:shake .4s}.opt.wrong b{background:#ff4d6d}
.opt:disabled{cursor:default}
@keyframes shake{25%{transform:translateX(-6px)}50%{transform:translateX(6px)}75%{transform:translateX(-3px)}}
.fb{margin-top:16px;padding:14px 16px;border-radius:14px;background:rgba(255,255,255,.06);line-height:1.5;display:none}
.fb.show{display:block;animation:rise .35s}.fb strong{display:block;margin-bottom:4px}
@keyframes rise{from{opacity:0;transform:translateY(8px)}}
.btn{margin-top:20px;display:inline-flex;align-items:center;gap:10px;padding:13px 24px;border:0;border-radius:999px;background:#fff;color:#09090d;font:inherit;font-weight:700;cursor:pointer}
.btn:disabled{opacity:.4;cursor:default}
.combo{font-weight:700;color:var(--c)}
.end{text-align:center;padding-top:30px}.score{font-size:64px;font-weight:800;margin:10px 0;background:linear-gradient(90deg,#ff4d6d,#ffd23f,#2ee59d,#00c2ff,#7b61ff);-webkit-background-clip:text;background-clip:text;color:transparent}
.muted{color:rgba(246,246,248,.65)}
</style></head>
<body><div class="wrap" id="app"></div>
<script type="application/json" id="data">${json}</script>
<script>
(function(){
var D=JSON.parse(document.getElementById('data').textContent);
function findAPI(w){var n=0;while(w&&n<12){if(w.API)return w.API;if(w===w.parent)break;w=w.parent;n++}return (window.opener&&window.opener.API)||null}
var API=findAPI(window);
function call(f){try{return API&&API[f]?API[f].apply(API,[].slice.call(arguments,1)):''}catch(e){return ''}}
call('LMSInitialize','');
var order=D.questions.map(function(q){var o=[0,1,2,3];for(var i=3;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=o[i];o[i]=o[j];o[j]=t}return o});
var i=0,score=0,streak=0,responses=[];var app=document.getElementById('app');
function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.textContent=h;return e}
function render(){
 app.innerHTML='';var q=D.questions[i];
 var top=el('div','top');top.appendChild(el('span','',D.title));top.appendChild(el('span','','Question '+(i+1)+' of '+D.questions.length+' \\u00b7 Score '+score));app.appendChild(top);
 var bar=el('div','bar');var s=el('span');bar.appendChild(s);app.appendChild(bar);setTimeout(function(){s.style.width=(i/D.questions.length*100)+'%'},20);
 app.appendChild(el('p','q',q.q));
 var opts=el('div','opts');var btns=[];
 order[i].forEach(function(orig,k){var b=el('button','opt');b.type='button';var tag=el('b','', 'ABCD'[k]);b.appendChild(tag);b.appendChild(el('span','',q.o[orig]));
  b.onclick=function(){answer(orig,b,btns)};btns.push({b:b,orig:orig});opts.appendChild(b)});
 app.appendChild(opts);
 var fb=el('div','fb');fb.id='fb';app.appendChild(fb);
 var next=el('button','btn',i+1<D.questions.length?'Next question \\u2192':'See my result \\u2192');next.id='next';next.disabled=true;next.onclick=function(){i++;i<D.questions.length?render():finish()};app.appendChild(next);
}
function answer(orig,b,btns){
 var q=D.questions[i];responses[i]=orig;var ok=orig===q.a;
 btns.forEach(function(x){x.b.disabled=true;if(x.orig===q.a)x.b.classList.add('right')});
 if(!ok)b.classList.add('wrong');
 if(ok){score++;streak++}else streak=0;
 var n=i;call('LMSSetValue','cmi.interactions.'+n+'.id',q.id);call('LMSSetValue','cmi.interactions.'+n+'.type','choice');
 call('LMSSetValue','cmi.interactions.'+n+'.student_response',String(orig));call('LMSSetValue','cmi.interactions.'+n+'.result',ok?'correct':'wrong');
 var fb=document.getElementById('fb');fb.innerHTML='';fb.appendChild(el('strong','',ok?(streak>=3?'Correct! \\ud83d\\udd25 '+streak+' in a row':'Correct!'):'Not quite.'));fb.appendChild(el('span','',q.e));fb.classList.add('show');
 document.getElementById('next').disabled=false;
}
function finish(){
 var passed=score>=D.pass;
 call('LMSSetValue','cmi.core.score.min','0');call('LMSSetValue','cmi.core.score.max',String(D.questions.length));call('LMSSetValue','cmi.core.score.raw',String(score));
 call('LMSSetValue','cmi.core.lesson_status',passed?'passed':'failed');call('LMSCommit','');call('LMSFinish','');
 app.innerHTML='';var end=el('div','end');end.appendChild(el('p','muted',D.title));end.appendChild(el('div','score',score+' / '+D.questions.length));
 end.appendChild(el('h1','',passed?'Stage cleared! \\ud83c\\udf89':'So close. Try again!'));
 end.appendChild(el('p','muted',passed?'You passed this stage test.':'You need '+D.pass+' correct answers to pass. Review the lesson and retake the test.'));
 if(!API){var r=el('button','btn','Retake test');r.onclick=function(){i=0;score=0;streak=0;responses=[];render()};end.appendChild(r)}
 app.appendChild(end);
}
render();
})();
</script></body></html>`;
}

export function manifest(course: Course, session: Session): string {
  const id = `li-${course.slug}-${session.id}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${id}" version="1.0"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata><schema>ADL SCORM</schema><schemaversion>1.2</schemaversion></metadata>
  <organizations default="org-${id}">
    <organization identifier="org-${id}">
      <title>${esc(`${course.title}: ${session.stage} test`)}</title>
      <item identifier="item-${id}" identifierref="res-${id}">
        <title>${esc(session.title)}</title>
        <adlcp:masteryscore>70</adlcp:masteryscore>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="res-${id}" type="webcontent" adlcp:scormtype="sco" href="index.html">
      <file href="index.html"/>
    </resource>
  </resources>
</manifest>
`;
}

export function scormZip(course: Course, session: Session, passScore: number): Uint8Array {
  return zipSync({
    "imsmanifest.xml": strToU8(manifest(course, session)),
    "index.html": strToU8(quizHtml(course, session, passScore)),
  });
}
