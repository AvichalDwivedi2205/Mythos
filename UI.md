# This is the UI feel which we will be going for in this

<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Aperture · Interview Room</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;1,9..144,300&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:       #080a10;
  --glass:    rgba(255,255,255,0.055);
  --glass2:   rgba(255,255,255,0.09);
  --glass3:   rgba(255,255,255,0.14);
  --border:   rgba(255,255,255,0.08);
  --border2:  rgba(255,255,255,0.13);
  --txt:      #dde0ec;
  --txt2:     rgba(221,224,236,0.48);
  --txt3:     rgba(221,224,236,0.26);
  --sage:     #86efac;
  --sage-d:   rgba(134,239,172,0.13);
  --sage-g:   rgba(134,239,172,0.07);
  --blue:     #93c5fd;
  --blue-d:   rgba(147,197,253,0.11);
  --amber:    #fbbf24;
  --amber-d:  rgba(251,191,36,0.12);
  --red:      #f87171;
  --red-d:    rgba(248,113,113,0.1);
  --cand:     rgba(255,255,255,0.06);
  --r:        11px;
  --r2:       16px;
  --ease:     cubic-bezier(0.16,1,0.3,1);
}
[data-theme="light"]{
  --bg:       #f2f1ed;
  --glass:    rgba(255,255,255,0.72);
  --glass2:   rgba(255,255,255,0.86);
  --glass3:   rgba(255,255,255,0.96);
  --border:   rgba(0,0,0,0.07);
  --border2:  rgba(0,0,0,0.12);
  --txt:      #1a1c26;
  --txt2:     rgba(26,28,38,0.52);
  --txt3:     rgba(26,28,38,0.3);
  --sage:     #16a34a;
  --sage-d:   rgba(22,163,74,0.09);
  --sage-g:   rgba(22,163,74,0.04);
  --blue:     #2563eb;
  --blue-d:   rgba(37,99,235,0.08);
  --amber:    #d97706;
  --amber-d:  rgba(217,119,6,0.09);
  --red:      #dc2626;
  --red-d:    rgba(220,38,38,0.08);
  --cand:     rgba(0,0,0,0.04);
}
html,body{height:100%;overflow:hidden;font-family:'Outfit',sans-serif;background:var(--bg);color:var(--txt);font-size:14px;font-weight:400;line-height:1.6;transition:background .35s var(--ease),color .35s var(--ease)}

#shell{display:grid;grid-template-columns:200px 1fr 262px;height:100vh}

.gpanel{
  background:var(--glass);
  backdrop-filter:blur(22px) saturate(160%);
  -webkit-backdrop-filter:blur(22px) saturate(160%);
  transition:background .35s var(--ease);
}

/* ════ LEFT ════ */
#left{
  border-right:1px solid var(--border);
  display:flex;flex-direction:column;
  padding:18px 14px;gap:22px;overflow:hidden;
}
.brand{display:flex;align-items:center;gap:9px}
.bgem{
  width:26px;height:26px;border-radius:7px;flex-shrink:0;
  background:linear-gradient(140deg,var(--sage),rgba(134,239,172,.3));
  display:flex;align-items:center;justify-content:center;
}
.gdot{width:9px;height:9px;border-radius:2.5px;background:var(--bg);opacity:.75}
.bname{font-family:'Fraunces',serif;font-size:15px;font-weight:400;color:var(--txt);letter-spacing:-.2px}

.tw{text-align:center;padding:8px 0}
.rsvg{display:block;margin:0 auto 5px}
.ttrack{fill:none;stroke:var(--border2);stroke-width:3}
.tprog{fill:none;stroke:var(--sage);stroke-width:3;stroke-linecap:round;stroke-dasharray:188.5;transition:stroke-dashoffset 1s linear}
.tnum{font-family:'Fraunces',serif;font-size:20px;font-weight:300;color:var(--txt);letter-spacing:-.5px;line-height:1}
.tof{font-size:10px;color:var(--txt3);letter-spacing:.3px;margin-top:3px}

.rl{font-size:9.5px;color:var(--txt3);letter-spacing:.6px;text-transform:uppercase;font-weight:600;padding:0 2px}

.phases{display:flex;flex-direction:column;gap:1px}
.ph{display:flex;align-items:center;gap:8px;padding:5px 7px;border-radius:7px;transition:background .2s}
.ph.active{background:var(--sage-d)}
.pip{width:5px;height:5px;border-radius:50%;flex-shrink:0}
.ph.done .pip{background:var(--sage)}
.ph.active .pip{background:var(--sage);box-shadow:0 0 5px var(--sage)}
.ph.pending .pip{background:var(--border2)}
.phn{font-size:11.5px;color:var(--txt2)}
.ph.active .phn{color:var(--txt);font-weight:500}
.ph.done .phn{color:var(--txt3)}

.agents{display:flex;flex-direction:column;gap:5px}
.ag{display:flex;align-items:center;gap:8px;padding:8px;border-radius:9px;background:var(--glass2);border:1px solid var(--border)}
.agav{width:27px;height:27px;border-radius:7px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-family:'Fraunces',serif;font-size:11px;font-weight:500;color:var(--bg)}
.avi{background:var(--sage)} .avt{background:var(--blue)}
.agin{flex:1;min-width:0}
.agn{font-size:11.5px;font-weight:500;color:var(--txt)}
.agr{font-size:10px;color:var(--txt3)}
.pulse{width:5px;height:5px;border-radius:50%;background:var(--sage);animation:pa 2.2s ease-in-out infinite;flex-shrink:0}
@keyframes pa{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(.7)}}

.rfoot{margin-top:auto;padding-top:12px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
.mbadge2{font-size:9.5px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;padding:3px 8px;border-radius:5px;border:1px solid var(--border2);color:var(--txt3)}
.fbtns{display:flex;gap:5px;align-items:center}
.ibt{
  width:30px;height:30px;border-radius:8px;border:1px solid var(--border2);
  background:var(--glass2);cursor:pointer;display:flex;align-items:center;
  justify-content:center;color:var(--txt2);font-size:13px;
  transition:all .2s;user-select:none;position:relative;
}
.ibt:hover{background:var(--glass3);color:var(--txt)}

/* Signals popup */
.strig{position:relative}
.spop{
  position:absolute;bottom:calc(100% + 8px);left:50%;
  transform:translateX(-50%) translateY(5px) scale(.96);
  width:208px;
  background:var(--glass3);
  backdrop-filter:blur(24px) saturate(180%);
  -webkit-backdrop-filter:blur(24px) saturate(180%);
  border:1px solid var(--border2);border-radius:12px;padding:14px;
  opacity:0;pointer-events:none;transition:all .22s var(--ease);z-index:200;
}
.strig.open .spop{opacity:1;pointer-events:all;transform:translateX(-50%) translateY(0) scale(1)}
.sph{font-size:10px;letter-spacing:.5px;text-transform:uppercase;color:var(--txt3);font-weight:600;margin-bottom:10px}
.sr{display:flex;align-items:center;gap:7px;margin-bottom:6px}
.sr:last-child{margin-bottom:0}
.snm{font-size:11px;color:var(--txt2);width:76px;flex-shrink:0}
.str{flex:1;height:3px;border-radius:3px;background:var(--border2);overflow:hidden}
.sfi{height:100%;border-radius:3px;transition:width 1.2s var(--ease)}
.svl{font-size:10.5px;font-weight:600;color:var(--txt);width:22px;text-align:right;flex-shrink:0}

/* ════ CENTER ════ */
#center{display:flex;flex-direction:column;overflow:hidden}

.ctop{
  display:flex;align-items:center;justify-content:space-between;
  padding:13px 18px;border-bottom:1px solid var(--border);flex-shrink:0;
}
.sname{font-family:'Fraunces',serif;font-size:14.5px;font-weight:400;color:var(--txt);letter-spacing:-.2px}
.ssub{font-size:11px;color:var(--txt3);margin-top:1px}
.pchip{
  display:flex;align-items:center;gap:5px;padding:4px 11px;border-radius:20px;
  background:var(--sage-d);border:1px solid rgba(134,239,172,.18);
  font-size:11px;font-weight:500;color:var(--sage);
}
[data-theme="light"] .pchip{color:var(--sage)}
.pcdot{width:5px;height:5px;border-radius:50%;background:var(--sage);animation:pa 2s infinite}
.endbtn{
  padding:5px 13px;border-radius:7px;border:1px solid var(--border2);
  background:transparent;color:var(--txt2);font-family:'Outfit',sans-serif;
  font-size:12px;font-weight:500;cursor:pointer;transition:all .2s;
}
.endbtn:hover{background:var(--red-d);border-color:rgba(248,113,113,.28);color:var(--red)}

/* ── TABS ── */
.tabs{
  display:flex;align-items:stretch;
  border-bottom:1px solid var(--border);flex-shrink:0;
  padding:0 16px;gap:2px;
}
.tab{
  display:flex;align-items:center;gap:7px;padding:10px 14px;cursor:pointer;
  border:none;background:transparent;font-family:'Outfit',sans-serif;
  font-size:12.5px;font-weight:500;color:var(--txt2);
  border-bottom:2px solid transparent;margin-bottom:-1px;
  transition:all .2s var(--ease);
}
.tab:hover{color:var(--txt)}
.tab.on-i{color:var(--sage);border-bottom-color:var(--sage)}
.tab.on-t{color:var(--blue);border-bottom-color:var(--blue)}
.tav{width:20px;height:20px;border-radius:5px;display:flex;align-items:center;justify-content:center;font-family:'Fraunces',serif;font-size:9.5px;font-weight:500;color:var(--bg);flex-shrink:0}
.tavi{background:var(--sage)} .tavt{background:var(--blue)}
.tsdot{width:5px;height:5px;border-radius:50%;background:var(--sage);animation:pa 2s infinite;flex-shrink:0}
.tsdot.bl{background:var(--blue)}
.notif{
  min-width:16px;height:16px;border-radius:8px;
  background:var(--red);color:#fff;font-size:9px;font-weight:700;
  display:none;align-items:center;justify-content:center;padding:0 4px;
  animation:npop .28s var(--ease);
}
.notif.on{display:flex}
@keyframes npop{from{transform:scale(0)}to{transform:scale(1)}}

/* ── PANELS ── */
.cpanel{display:none;flex-direction:column;flex:1;overflow:hidden}
.cpanel.vis{display:flex;animation:pin .28s var(--ease)}
@keyframes pin{from{opacity:0;transform:translateX(5px)}to{opacity:1;transform:translateX(0)}}

.msgs{
  flex:1;overflow-y:auto;padding:20px;
  display:flex;flex-direction:column;gap:0;scroll-behavior:smooth;
}
.msgs::-webkit-scrollbar{width:3px}
.msgs::-webkit-scrollbar-thumb{background:var(--border2);border-radius:3px}

.sysln{text-align:center;font-size:11px;color:var(--txt3);padding:8px 0 16px}
.sysln span{padding:3px 12px;border-radius:20px;border:1px solid var(--border);background:var(--glass)}
.phdiv{
  display:flex;align-items:center;gap:10px;padding:16px 0 13px;
  color:var(--txt3);font-size:10.5px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;
}
.phdiv::before,.phdiv::after{content:'';flex:1;height:1px;background:var(--border)}

.msg{display:flex;flex-direction:column;margin-bottom:14px;animation:min .35s var(--ease) both}
@keyframes min{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
.mhd{display:flex;align-items:center;gap:7px;margin-bottom:4px;padding:0 1px}
.spk{font-size:11.5px;font-weight:600}
.si{color:var(--sage)} .st{color:var(--blue)} .sc{color:var(--txt2)}
.mt{font-size:10px;color:var(--txt3)}
.mbg{font-size:9px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;padding:2px 6px;border-radius:4px}
.bg-brief{background:var(--sage-d);color:var(--sage)}
.bg-team{background:var(--blue-d);color:var(--blue)}
.bg-nudge{background:var(--amber-d);color:var(--amber)}
.bg-stress{background:var(--red-d);color:var(--red)}
[data-theme="light"] .bg-brief{color:var(--sage)}
[data-theme="light"] .bg-team{color:var(--blue)}

.bub{padding:11px 15px;font-size:13.5px;line-height:1.7;color:var(--txt);border:1px solid var(--border);max-width:100%}
.bi{background:var(--sage-g);border-color:rgba(134,239,172,.14);border-left:2.5px solid var(--sage);border-radius:3px var(--r2) var(--r2) var(--r2)}
[data-theme="light"] .bi{background:rgba(22,163,74,0.04);border-color:rgba(22,163,74,.14)}
.bt{background:var(--blue-d);border-color:rgba(147,197,253,.14);border-left:2.5px solid var(--blue);border-radius:3px var(--r2) var(--r2) var(--r2)}
[data-theme="light"] .bt{background:rgba(37,99,235,0.05);border-color:rgba(37,99,235,.12)}
.bc{background:var(--cand);border-color:var(--border2);border-radius:var(--r2) var(--r2) var(--r2) 3px;max-width:88%;margin-left:auto}
.bnudge{border-left-color:var(--amber)!important}
.bstress{border-left-color:var(--red)!important}
.mev{
  display:inline-flex;align-items:center;gap:5px;margin-top:6px;
  font-size:10px;color:var(--txt3);padding:2px 8px;border-radius:4px;
  border:1px solid var(--border);background:var(--glass);
}
.edot{width:4px;height:4px;border-radius:50%}

.tbub{padding:9px 14px;display:inline-flex;align-items:center;gap:3px;background:var(--glass2);border:1px solid var(--border);border-radius:3px var(--r2) var(--r2) var(--r2)}
.dot{width:4px;height:4px;border-radius:50%;background:var(--txt3);animation:td 1.3s ease-in-out infinite}
.dot:nth-child(2){animation-delay:.15s}.dot:nth-child(3){animation-delay:.3s}
@keyframes td{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-4px);opacity:1}}

.inpa{
  flex-shrink:0;padding:12px 18px;border-top:1px solid var(--border);
  background:var(--glass);
  backdrop-filter:blur(22px) saturate(160%);
  -webkit-backdrop-filter:blur(22px) saturate(160%);
}
.inpr{display:flex;align-items:flex-end;gap:8px}
.inp{
  flex:1;background:var(--glass2);border:1px solid var(--border2);
  border-radius:var(--r);padding:9px 13px;color:var(--txt);
  font-family:'Outfit',sans-serif;font-size:13.5px;resize:none;outline:none;
  min-height:40px;max-height:96px;line-height:1.5;transition:border-color .2s;
}
.inp::placeholder{color:var(--txt3)}
#ii:focus{border-color:rgba(134,239,172,.28)}
#it:focus{border-color:rgba(147,197,253,.28)}
.snd{width:40px;height:40px;border-radius:var(--r);border:none;flex-shrink:0;background:var(--sage);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s var(--ease)}
.snd.bl{background:var(--blue)}
.snd:hover{opacity:.82;transform:scale(1.05)}
.snd svg{stroke:var(--bg);fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.inh{font-size:10.5px;color:var(--txt3);margin-top:6px}

/* ════ RIGHT ════ */
#right{border-left:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden}
.nhd{display:flex;align-items:center;justify-content:space-between;padding:16px 14px 12px;border-bottom:1px solid var(--border);flex-shrink:0}
.ntitle{font-family:'Fraunces',serif;font-size:14px;font-weight:400;color:var(--txt)}
.abtn{width:24px;height:24px;border-radius:6px;border:1px solid var(--border2);background:var(--glass2);color:var(--txt2);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:15px;transition:all .2s;line-height:1;padding-bottom:1px}
.abtn:hover{background:var(--glass3);color:var(--txt)}
.nbody{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:9px}
.nbody::-webkit-scrollbar{width:2px}
.nbody::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}

.sticky{border-radius:3px 10px 10px 3px;padding:11px 11px 9px;position:relative;animation:ni .3s var(--ease) both;box-shadow:2px 4px 14px rgba(0,0,0,.2),0 0 0 1px rgba(0,0,0,.07);border-left:4px solid rgba(0,0,0,.09)}
[data-theme="light"] .sticky{box-shadow:2px 3px 10px rgba(0,0,0,.1),0 0 0 1px rgba(0,0,0,.05)}
@keyframes ni{from{opacity:0;transform:scale(.93) translateY(5px)}to{opacity:1;transform:scale(1) translateY(0)}}
.shd{display:flex;align-items:center;justify-content:space-between;margin-bottom:5px}
.slbl{font-size:9px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:rgba(0,0,0,.35)}
.scls{width:15px;height:15px;border-radius:3px;border:none;background:rgba(0,0,0,.1);cursor:pointer;font-size:9px;color:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;transition:all .15s;padding:0;line-height:1}
.scls:hover{background:rgba(0,0,0,.2);color:rgba(0,0,0,.7)}
.sta{width:100%;background:transparent;border:none;outline:none;resize:none;font-family:'Outfit',sans-serif;font-size:12px;color:rgba(0,0,0,.7);line-height:1.55;min-height:48px;max-height:140px}
.sta::placeholder{color:rgba(0,0,0,.28)}
</style>
</head>
<body>
<div id="shell">

<!-- ════ LEFT RAIL ════ -->
<aside id="left" class="gpanel" style="border-right:1px solid var(--border);display:flex;flex-direction:column;padding:18px 14px;gap:22px;overflow:hidden;">
  <div class="brand">
    <div class="bgem"><div class="gdot"></div></div>
    <span class="bname">Aperture</span>
  </div>

  <div class="tw">
    <svg class="rsvg" width="68" height="68" viewBox="0 0 68 68">
      <circle class="ttrack" cx="34" cy="34" r="30" transform="rotate(-90 34 34)"/>
      <circle class="tprog" id="tr" cx="34" cy="34" r="30" transform="rotate(-90 34 34)" style="stroke-dashoffset:132"/>
    </svg>
    <div class="tnum" id="td">18:44</div>
    <div class="tof">of 60 min</div>
  </div>

  <div>
    <div class="rl" style="margin-bottom:7px">Phases</div>
    <div class="phases">
      <div class="ph done"><div class="pip"></div><span class="phn">Problem Framing</span></div>
      <div class="ph done"><div class="pip"></div><span class="phn">Requirements</span></div>
      <div class="ph active"><div class="pip"></div><span class="phn">High-Level Design</span></div>
      <div class="ph pending"><div class="pip"></div><span class="phn">Deep Dive</span></div>
      <div class="ph pending"><div class="pip"></div><span class="phn">Stress &amp; Defense</span></div>
      <div class="ph pending"><div class="pip"></div><span class="phn">Wrap-Up</span></div>
    </div>
  </div>

  <div>
    <div class="rl" style="margin-bottom:7px">In this room</div>
    <div class="agents">
      <div class="ag">
        <div class="agav avi">I</div>
        <div class="agin"><div class="agn">Interviewer</div><div class="agr">Mode · probe</div></div>
        <div class="pulse"></div>
      </div>
      <div class="ag">
        <div class="agav avt">P</div>
        <div class="agin"><div class="agn">Priya</div><div class="agr">SRE · Infra</div></div>
        <div class="pulse"></div>
      </div>
    </div>
  </div>

  <div class="rfoot">
    <div class="mbadge2">Assessment</div>
    <div class="fbtns">
      <div class="ibt strig" id="strig" onclick="toggleSig()" title="Live signals">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        <div class="spop">
          <div class="sph">Live Signals</div>
          <div class="sr"><div class="snm">Requirements</div><div class="str"><div class="sfi" style="width:88%;background:var(--sage)"></div></div><div class="svl">88</div></div>
          <div class="sr"><div class="snm">Architecture</div><div class="str"><div class="sfi" style="width:68%;background:var(--blue)"></div></div><div class="svl">68</div></div>
          <div class="sr"><div class="snm">Tradeoffs</div><div class="str"><div class="sfi" style="width:54%;background:var(--amber)"></div></div><div class="svl">54</div></div>
          <div class="sr"><div class="snm">Collaboration</div><div class="str"><div class="sfi" style="width:75%;background:var(--sage)"></div></div><div class="svl">75</div></div>
          <div class="sr"><div class="snm">Nudges given</div><div class="str"><div class="sfi" style="width:16%;background:var(--red)"></div></div><div class="svl">1</div></div>
        </div>
      </div>
      <div class="ibt" onclick="toggleTheme()" title="Toggle theme">◐</div>
    </div>
  </div>
</aside>

<!-- ════ CENTER ════ -->
<main id="center" style="display:flex;flex-direction:column;overflow:hidden;">

  <div class="ctop gpanel" style="border-bottom:1px solid var(--border)">
    <div><div class="sname">Real-Time Chat at Scale</div><div class="ssub">System Design · Senior Engineer</div></div>
    <div class="pchip"><div class="pcdot"></div>Phase 3 · High-Level Design</div>
    <button class="endbtn">End Session</button>
  </div>

  <!-- TABS -->
  <div class="tabs gpanel" style="border-bottom:1px solid var(--border)">
    <button class="tab on-i" id="tab-i" onclick="sw('i')">
      <div class="tav tavi">I</div>
      Interviewer
      <div class="tsdot"></div>
      <div class="notif" id="ni">0</div>
    </button>
    <button class="tab" id="tab-t" onclick="sw('t')">
      <div class="tav tavt">P</div>
      Priya · SRE
      <div class="tsdot bl"></div>
      <div class="notif" id="nt">0</div>
    </button>
  </div>

  <!-- INTERVIEWER PANEL -->
  <div class="cpanel vis" id="pi">
    <div class="msgs" id="mi">
      <div class="sysln"><span>Interviewer channel · Assessment Mode · Rubric v2.1</span></div>
      <div class="phdiv">Problem Framing</div>

      <div class="msg">
        <div class="mhd"><span class="spk si">Interviewer</span><span class="mbg bg-brief">Brief</span><span class="mt">00:00</span></div>
        <div class="bub bi">You're designing a real-time messaging platform. The system must support 10 million concurrent users globally with messages arriving in under 200ms end-to-end. Take a few minutes to clarify before designing.</div>
      </div>

      <div class="phdiv">Requirement Discovery</div>

      <div class="msg">
        <div class="mhd"><span class="spk sc">You</span><span class="mt">01:40</span></div>
        <div class="bub bc">Are we supporting DMs only, or group chats as well? What's the ordering requirement — strong per-conversation or eventual? And do we need offline delivery?</div>
      </div>
      <div class="msg">
        <div class="mhd"><span class="spk si">Interviewer</span><span class="mt">02:55</span></div>
        <div class="bub bi">Both DMs and groups — up to 500 members per group. Strong ordering within each conversation is required. Offline delivery within a 7-day window.</div>
      </div>
      <div class="msg">
        <div class="mhd"><span class="spk sc">You</span><span class="mt">03:20</span></div>
        <div class="bub bc">Are presence indicators and read receipts in scope? That changes the write volume significantly.</div>
      </div>
      <div class="msg">
        <div class="mhd"><span class="spk si">Interviewer</span><span class="mt">03:45</span></div>
        <div class="bub bi">Presence yes. Read receipt delivery can be best-effort — don't over-engineer that.</div>
      </div>

      <div class="phdiv">High-Level Design</div>

      <div class="msg">
        <div class="mhd"><span class="spk sc">You</span><span class="mt">09:50</span></div>
        <div class="bub bc">After working through the routing concern with Priya — WebSocket gateway with consistent hashing, Kafka for cross-node fan-out partitioned by user ID, Cassandra for message storage. Still finalising the ordering scheme.</div>
      </div>
      <div class="msg">
        <div class="mhd"><span class="spk si">Interviewer</span><span class="mbg bg-nudge">Nudge</span><span class="mt">10:10</span></div>
        <div class="bub bi bnudge">You've described the delivery path well. But storage ordering is still open — you said strong ordering is required. How does Cassandra give you that, and what's your message ID strategy?</div>
        <div class="mev"><div class="edot" style="background:var(--amber)"></div>Nudge · storage ordering not yet addressed</div>
      </div>

      <div class="msg" id="typ-i">
        <div class="mhd"><span class="spk sc">You</span><span class="mt" id="tt-i">10:14</span></div>
        <div class="tbub"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>
      </div>
    </div>
    <div class="inpa">
      <div class="inpr">
        <textarea class="inp" id="ii" placeholder="Reply to interviewer…" rows="1" onkeydown="hk(event,'i')" oninput="ah(this)"></textarea>
        <button class="snd" onclick="send('i')">
          <svg width="15" height="15" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
      </div>
      <div class="inh">Enter to send · Shift+Enter for new line</div>
    </div>
  </div>

  <!-- TEAMMATE PANEL -->
  <div class="cpanel" id="pt">
    <div class="msgs" id="mt">
      <div class="sysln"><span>Priya · SRE &amp; Infra Specialist · Teammate channel</span></div>
      <div class="phdiv">High-Level Design</div>

      <div class="msg">
        <div class="mhd"><span class="spk sc">You</span><span class="mt">06:10</span></div>
        <div class="bub bc">Thinking WebSocket gateway for persistent connections, Kafka as backbone, Cassandra for storage partitioned by conversation ID, Redis for presence. Gateway handles fan-out.</div>
      </div>
      <div class="msg">
        <div class="mhd"><span class="spk st">Priya</span><span class="mbg bg-team">SRE</span><span class="mt">07:02</span></div>
        <div class="bub bt">Pushing on the WebSocket gateway — at 10M concurrent, each node handles maybe 100–150k realistically. You're at 70–100 gateway nodes minimum. What's your strategy for routing when a user reconnects, or when sender and receiver land on different nodes?</div>
        <div class="mev"><div class="edot" style="background:var(--blue)"></div>Concern raised · cross-node routing</div>
      </div>
      <div class="msg">
        <div class="mhd"><span class="spk sc">You</span><span class="mt">08:55</span></div>
        <div class="bub bc">Consistent hashing at the load balancer keyed to user ID — routes to a stable gateway. For cross-node: each gateway subscribes to Kafka topics by user ID. Message from gateway-3 destined for gateway-7 goes via Kafka. Reconnects rehash to the same node.</div>
      </div>
      <div class="msg">
        <div class="mhd"><span class="spk st">Priya</span><span class="mbg bg-team">SRE</span><span class="mt">09:30</span></div>
        <div class="bub bt">That routing holds up. One concern though — Kafka partition rebalancing during a leader failure could cause a 2–3s delivery gap. How do you handle messages in-flight during that window without introducing duplicates?</div>
        <div class="mev"><div class="edot" style="background:var(--blue)"></div>Concern raised · Kafka partition failover</div>
      </div>

      <div class="msg" id="typ-t">
        <div class="mhd"><span class="spk sc">You</span><span class="mt" id="tt-t">10:14</span></div>
        <div class="tbub"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>
      </div>
    </div>
    <div class="inpa">
      <div class="inpr">
        <textarea class="inp" id="it" placeholder="Reply to Priya…" rows="1" onkeydown="hk(event,'t')" oninput="ah(this)"></textarea>
        <button class="snd bl" onclick="send('t')">
          <svg width="15" height="15" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
      </div>
      <div class="inh">Enter to send · Shift+Enter for new line</div>
    </div>
  </div>

</main>

<!-- ════ RIGHT ════ -->
<aside id="right" class="gpanel" style="border-left:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden;">
  <div class="nhd">
    <div class="ntitle">Scratch Pad</div>
    <button class="abtn" onclick="addN()" title="New note">+</button>
  </div>
  <div class="nbody" id="nb">
    <div class="sticky" style="background:#f7ec6e">
      <div class="shd"><div class="slbl">Requirement</div><button class="scls" onclick="rmN(this)">✕</button></div>
      <textarea class="sta" placeholder="Note…">Strong ordering within each conversation</textarea>
    </div>
    <div class="sticky" style="background:#fde68a">
      <div class="shd"><div class="slbl">Constraint</div><button class="scls" onclick="rmN(this)">✕</button></div>
      <textarea class="sta" placeholder="Note…">Offline delivery → 7-day window</textarea>
    </div>
    <div class="sticky" style="background:#bbf7d0">
      <div class="shd"><div class="slbl">Design note</div><button class="scls" onclick="rmN(this)">✕</button></div>
      <textarea class="sta" placeholder="Note…">Groups ≤500 members · Presence = yes · Receipts = best-effort</textarea>
    </div>
    <div class="sticky" style="background:#bfdbfe">
      <div class="shd"><div class="slbl">Open question</div><button class="scls" onclick="rmN(this)">✕</button></div>
      <textarea class="sta" placeholder="Note…">Message ID scheme — ULID? Snowflake? Needed for Cassandra ordering</textarea>
    </div>
  </div>
</aside>

</div>
<script>
// ── TIMER
let secs=18*60+44;
const C=188.5;
function tick(){
  secs++;
  const m=Math.floor(secs/60),s=secs%60;
  const ds=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
  document.getElementById('td').textContent=ds;
  ['tt-i','tt-t'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=ds});
  document.getElementById('tr').style.strokeDashoffset=C-Math.min(secs/3600,1)*C;
}
setInterval(tick,1000);
document.getElementById('tr').style.strokeDashoffset=C-(secs/3600)*C;

// ── THEME
function toggleTheme(){const h=document.documentElement;h.setAttribute('data-theme',h.getAttribute('data-theme')==='dark'?'light':'dark')}

// ── SIGNALS POPUP
const strig=document.getElementById('strig');
function toggleSig(){strig.classList.toggle('open')}
document.addEventListener('click',e=>{if(!strig.contains(e.target))strig.classList.remove('open')});

// ── TABS
let cur='i';
function sw(tab){
  cur=tab;
  document.getElementById('pi').classList.toggle('vis',tab==='i');
  document.getElementById('pt').classList.toggle('vis',tab==='t');
  document.getElementById('tab-i').className='tab'+(tab==='i'?' on-i':'');
  document.getElementById('tab-t').className='tab'+(tab==='t'?' on-t':'');
  const nb=document.getElementById('n'+tab);
  nb.classList.remove('on');nb.textContent='0';
  setTimeout(()=>{const inp=document.getElementById('i'+tab);if(inp)inp.focus()},50);
}

function pushN(tab){
  if(cur===tab)return;
  const nb=document.getElementById('n'+tab);
  const c=parseInt(nb.textContent||'0')+1;
  nb.textContent=c;nb.classList.add('on');
}

// ── INPUT
function hk(e,p){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send(p)}}
function ah(t){t.style.height='auto';t.style.height=Math.min(t.scrollHeight,96)+'px'}
function esc(s){return s.replace(/[<>]/g,c=>c==='<'?'&lt;':'&gt;')}

const IR=[
  "Good. Walk me through your message ID strategy — how do you guarantee ordering within Cassandra?",
  "That handles ordering. What happens if a Kafka partition leader fails mid-fanout — how do you recover without duplicates or missed messages?",
  "Let's stress this. Traffic spikes 20x in 90 seconds — viral event. What breaks first in your current architecture?",
  "Good recovery. Final question: how do you handle cross-region consistency for group messages across two active regions?",
];
const TR=[
  "Idempotency keys on the producer side makes sense for deduplication. But what about consumers — how does a gateway know it's already delivered a message it's seeing replayed?",
  "At 500-member groups, fan-out from a single Kafka consumer to 500 WebSocket connections is expensive. Have you considered offloading group fan-out to a dedicated service?",
  "The fan-out service works. For presence at this scale though — Redis pub/sub could bottleneck under a spike. What's your degraded-mode strategy if presence becomes unavailable?",
];
let iIdx=0,tIdx=0;

function send(panel){
  const inp=document.getElementById('i'+panel);
  const val=inp.value.trim();
  if(!val)return;
  const mc=document.getElementById('m'+panel);
  const typ=document.getElementById('typ-'+panel);
  const m=document.createElement('div');
  m.className='msg';
  const t=document.getElementById('td').textContent;
  m.innerHTML=`<div class="mhd"><span class="spk sc">You</span><span class="mt">${t}</span></div><div class="bub bc">${esc(val)}</div>`;
  mc.insertBefore(m,typ);
  inp.value='';inp.style.height='auto';
  mc.scrollTop=mc.scrollHeight;
  typ.style.display='flex';

  setTimeout(()=>{
    typ.style.display='none';
    const rep=document.createElement('div');
    rep.className='msg';
    const now=document.getElementById('td').textContent;
    if(panel==='i'){
      const isStress=iIdx===2;
      const txt=IR[iIdx%IR.length];iIdx++;
      rep.innerHTML=`
        <div class="mhd"><span class="spk si">Interviewer</span>${isStress?'<span class="mbg bg-stress">Stress</span>':''}<span class="mt">${now}</span></div>
        <div class="bub bi ${isStress?'bstress':''}">${txt}</div>
        ${isStress?'<div class="mev"><div class="edot" style="background:var(--red)"></div>Stress injection · scale challenge</div>':''}
      `;
    } else {
      const txt=TR[tIdx%TR.length];tIdx++;
      rep.innerHTML=`
        <div class="mhd"><span class="spk st">Priya</span><span class="mbg bg-team">SRE</span><span class="mt">${now}</span></div>
        <div class="bub bt">${txt}</div>
        <div class="mev"><div class="edot" style="background:var(--blue)"></div>Teammate response</div>
      `;
    }
    mc.insertBefore(rep,typ);mc.appendChild(typ);mc.scrollTop=mc.scrollHeight;
    pushN(panel==='i'?'t':'i');
  },1600+Math.random()*700);
}

// ── NOTES
const NC=['#f7ec6e','#fde68a','#bbf7d0','#bfdbfe','#fecaca','#f5d0fe'];
const NL=['Note','Assumption','Open question','Design note','To revisit','Constraint'];
let nc=6;
function addN(){
  const body=document.getElementById('nb');
  const n=document.createElement('div');
  n.className='sticky';
  const i=nc%NC.length;nc++;
  n.style.background=NC[i];
  n.innerHTML=`<div class="shd"><div class="slbl">${NL[i]}</div><button class="scls" onclick="rmN(this)">✕</button></div><textarea class="sta" placeholder="Write a note…"></textarea>`;
  body.appendChild(n);
  body.scrollTop=body.scrollHeight;
  n.querySelector('textarea').focus();
}
function rmN(btn){
  const n=btn.closest('.sticky');
  n.style.transition='all .22s var(--ease)';
  n.style.transform='scale(0.9)';n.style.opacity='0';
  setTimeout(()=>n.remove(),220);
}
</script>
</body>
</html>