(function(CS){

const currentScript = document.currentScript;
const jsPrefix=(/(.*\/)([^\/]+)(\?.*)?/.exec(currentScript.src)||['',''])[1];

async function loadScript (src,attrs={})
{	// {{{
	const se=document.createElement("script"),
	      rv=new Promise((or,oe)=>se.addEventListener("load",()=>or(se.value)));
	for(let key in attrs) se.setAttribute(key,attrs[key]);
	se.src=src;
	document.head.appendChild(se);
	return (await rv)||se;
}	// }}}

function* ancestors (se, ef=(e)=>!!e)
{	// generate all parent elements until ef() {{{
	while (ef(se)) {
		yield se;
		se=se.parentNode;
	}
}	// }}}

class sw {
	// TODO {{{
	constructor (csn='!hide') {
		this.S={};
		this.L=[];
		if (csn.startsWith('!')) {
			this.CSN=csn.substr(1);
			this.OP=(n,name)=>n!==name;
		} else {
			this.CSN=csn;
			this.OP=(n,name)=>n===name;
		}
	}
	add (name,elem) {
		this.S[name]=elem;
	}
	addlink (elem) {
		this.L.push(elem);
	}
	choose (name) {
		for (const n in this.S)
			this.S[n].classList[this.OP(n,name)?'add':'remove'](this.CSN);
		this.L.forEach((e)=>{ if(e.sw) e.sw.choose(name); });
	}
}	// }}}

const Plugins={
	"TeX":async function (slide) {
		return await loadScript(jsPrefix+'TeX.js');
	},
	"tab":async function (slide) { // {{{
		const es=Array.from(document.body.querySelectorAll('#content .tab'));
		if (es.length<=0)
			return console.log(`
Usaeg:
	<div class='tab'>
		<div><button TID="1">ONE</button><button TID="2">TWO</button></div>
		<div TAB="1">ONE ONE ONE</div>
		<div TAB="2">TWO TWO TWO</div>
	</div>
`);	
		es.forEach(function (C) {
			C.addEventListener('click',function (evt) {
				const tis=Array.from(C.querySelectorAll('[TID]')),
				      ti=tis.find((e)=>e.contains(evt.target));
				if(!ti) return;
				const tid=ti.getAttribute('TID');
				tis.forEach((e)=>e.classList[ti===e?'add':'remove']('active'));
				Array.from(C.querySelectorAll('[TAB]')).forEach((tab) => {
					setTimeout(()=>{
					tab.classList[tid===tab.getAttribute('TAB')?'remove':'add']('hide');
					},100);
					evt.stopPropagation();
					evt.preventDefault();
				});
			});
			C.querySelector('[TID]').click();
		});
	}	// }}}
};	// Built-in Plugins

class Aside
{	// Aside tutorial bar
	constructor (RE=document.body)
	{	// {{{
		this.RE=RE;

		((E)=>{ // create panel-overlay (mask) {{{
			E.addEventListener('click', (evt) => this.close());
			((S)=>{
				// [CSS] position:fixed; top:0; left:0; right:0; bottom:0;
				S.position="fixed";
				S.top=S.left=S.right=S.bottom=0;
				// [CSS] background:rgba(0,0,0,0.4); z-index:10001;
				S.background="rgba(0,0,0,0.4)";
				S.zIndex=10001;
				// [CSS] transition:opacity 0.3s ease, visibility 0.3s;
				S.transition="opacity 0.3s ease, visibility 0.3s";
			})(E.style);
			RE.appendChild(E);
		})(this.Overlay=document.createElement('div')); // }}}

		((E) => { // Aside bar {{{
			E.setAttribute("current","toc");
			E.innerHTML=`
<style>
aside {
	position:fixed; top:0; right:0; bottom:0; width:100vh; max-width:80vw; z-index:10002;
	border-left:1px solid #eee;
	font-size:2vmin; box-shadow:-2px 0 10px rgba(0,0,0,0.1);
	background:#fff;
	transform:translateX(100%);transition:transform 0.3s ease;
	display:flex;flex-flow:column nowrap;justify-content:space-between;align-items:center;
}
aside button {font-size:2vmin;border-radius:1vmin;padding:0.5vmin 1vmin;}
aside nav ol { list-style:none; padding:0; margin:0;}
aside nav li { margin: 4px 0; padding:2px; border:1px solid white; }
aside nav li:hover { border-color:orange; }
aside [data-h^="aside:tab:"] {
	flex:1 1 auto;
	text-align:center;
	border-radius:0.5vmin; border:1px solid blue; margin:1px;
	font-size:120%; font-weight:bold;
}
aside [data-h^="aside:tab:"].selected { border-color:white; }
aside [data-h^="aside:tab:"]:not(.selected):hover { background:lightblue; }
aside [data-uid^="aside:tab:"] { flex:1; overflow-y:auto; height:100%; background:#eee; }
aside [data-uid^="aside:tab:"]:not(.selected) { display:none; }
aside [data-uid^="aside:Settings:"] {
	border:1px solid silver; border-radius:4px;
	padding:2px; margin:2px;
	background:white;
}
aside .Options { display:flex;flex-flow:row wrap;justify-content:space-between;align-items:center; }
aside .Options>div { flex:1 1 auto;border-bottom:1px solid black;margin:1px 4px; }
aside .Options>div:hover { color:blue;border-color:blue; }
</style>
<div style="padding:2px 8px;border-bottom:1px solid #eee;display:flex;flex-flow:row nowrap;width:100%;">
	<div data-h="aside:tab:TOC">導覽</div>
	<div data-h="aside:tab:Settings">設定</div>
</div>
<div style="flex:1 1 auto;overflow-y:auto;width:100%;padding:2px; 8px;">
	<nav data-uid='aside:tab:TOC'></nav>
	<div data-uid='aside:tab:Settings'>
		<div data-uid='aside:Settings:Filter'>
			<div style='display:flex;flex-flow:row nowrap;justify-content:space-between;padding:2px 6px;'>
				<span data-h='filter:add'>➕</span>
				<label>頁面選擇器</label>
				<span data-h='filter:run'>➤</span>
			</div>
			<div class='Options'></div>
		</div>
		<div data-uid='aside:Settings:FontSize'>
			<label>字型大小</label>
			<div style='display:flex;flex-flow:row nowrap;'>
				<input data-h='slide:resize' type='range' min='0.8' max='1.5' step='0.1' value='1' style='flex:1 1 auto;width:100%'/>
				<span style='min-width:32px;text-align:center;'>1</span>
			</div>
		</div>
	</div>
</div>
<div style="padding:0.5rem 1rem;border-top:1px solid #eee;width:100%;display:flex;flex-flow:row nowrap;justify-content:space-between;">
	<span style='width:0px;overflow:display;white-space:nowrap;'>© Porshen &amp; Cyberpiers 2026</span>
	<span id='Aside_Pager' style='background:#fff;gap:10px;'>
		<input data-h='slide:goto' type='number' min='1' step='1' style='font-size:90%;text-align:right;'/> /
		<span style='color:#666;'></span>
	</span>
</div>`;
			if (!E.__handler__) {
				E.__handler__ = (evt) => {
					const e = evt.target;
					const f = (e.dataset.h||"").split(',');
					switch (f[0]) {
					case 'aside:tab:TOC':
					case 'aside:tab:Settings':
						Array.from(e.parentNode.querySelectorAll('[data-h^="aside:tab:"]'))
							.forEach((e)=>e.classList.remove('selected'));
						e.classList.add('selected');
						Array.from(E.querySelectorAll('[data-uid^="aside:tab:"]'))
							.forEach((c)=>c.classList[c.dataset.uid===e.dataset.h?"add":"remove"]('selected'));
						break;
					case "slide:resize":
						e.parentNode.querySelector('span').textContent=e.value;
						document.applyFontSize(e.value);
						break;
/*
			"fullscreen": (mode) => {
				if (mode) {
					if(!document.fullscreenElement) document.body.requestFullscreen();
				} else if(document.fullscreenElement) document.exitFullscreen();
			},
*/
					case "slide:goto":
						if (f[1]) {
							document.querySelector(`#${f[1]}`).click();
							this.close();
						} else {
							document.querySelector(
								`#__slide_${e.parentNode.querySelector('input').value}__`
							).click();
						}
						break;
					case 'addValue':
						((se,val)=>{
							const vs=se.textContent.split('.').filter((v)=>v);
							vs.push(val);
							se.textContent=vs.join('.');
						})(e.parentNode.querySelector('span'),e.value);
						e.value='-';
						break;
					case 'addFilter':
						break;
					case 'openFilter':
						window.open(
							location.href.replace(location.hash,'')+
							'?s='+e.textContent+
							location.hash
						);
						break;
					}
					evt.stopPropagation();
				};
			}
			E.addEventListener('change', E.__handler__);
			E.addEventListener('click', E.__handler__);
			this.Overlay.appendChild(E);
			document.querySelector('[data-h^="aside:tab:"]').click();
			return E;
		})(this.E=document.createElement("aside")); // }}}

		((E) => { // Dialog Element {{{
			E.setAttribute('style','display:none;flex-flow:column nowrap;position:absolute;left:8px;top:8px;right:8px;bottom:8px;overflow:hidden;');
			E.innerHTML=`
<div UID='Caption' style='border-bottom:2px solid gold;margin-bottom:4px;padding:0 4px;border-radius:4px;background:white;'></div>
<section style='flex:1 1 auto;height:100%;background:white;padding:0 4px;margin:4px 0;border-radius:6px;overflow:hidden;'></section>
`;
			this.Overlay.appendChild(E);
			E.appendChild(E.Caption=E.querySelector('[UID="Caption"]'));
			E.appendChild(E.View=E.querySelector('section'));
			E.View.addEventListener('click',(evt)=>{
				evt.stopPropagation();
				evt.preventDefault();
			});
		})(this.DE=document.createElement("div")); // }}}

		this.close();
	}	// }}}
	update (index, total)
	{	// update status information {{{
		if (index&&total) {
			((pager)=>{
				pager.querySelector('span').textContent=total;
				((ipt)=>{
					ipt.value=index;
					ipt.setAttribute('max',total);
				})(pager.querySelector('input'));
			})(this.E.querySelector('#Aside_Pager'));
			Array.from(this.E.querySelectorAll('[tab="toc"]>ol a'))
				.forEach((link, i) => link.classList.toggle('active', i === index-1));
		}
		//this.E.querySelector('[data-h="fsToggle"]').checked = !!document.fullscreenElement;
	}	// }}}
	install (content)
	{	// install TOC table {{{
		const tl=this.E.querySelector('[data-uid="aside:tab:TOC"]');
		tl.innerHTML="<ol>"+Array.from(content.querySelectorAll('section'))
		.reduce((rs, sec, idx) => {
			let t=sec.querySelector('h1') || sec.querySelector('h2');
			if (t) {
				t=t.textContent;
				rs+=`<li data-h="slide:goto,${sec.id}">${t}</li>`;
/*
				if (t.nodeType===1)
					t=t.textContent.trim();
				const li = document.createElement('li');
				while (li.firstChild) li.removeChild(li.firstChild);
				const a = document.createElement('a');
				//a.href = '#' + sec.dataset.sid;
				a.textContent = t;
				li.appendChild(a);
				tl.appendChild(li);
*/
			}
			return rs;
		}, "")+"</ol>";
	}	// }}}
	installSetting (elem)
	{	// {{{
		const pe=this.E.querySelector('[data-uid="aside:tab:Settings"]');
		if (pe !== elem.parentNode) pe.appendChild(elem);
	}	// }}}
	open (dialog, caption)
	{	// launch aside bar {{{
		// if (document.fullscreenElement) document.exitFullscreen();
		((S)=>{ // [CSS] opacity:1; visiblity:visible;
			S.opacity=1;
			S.visibility='visible';
		})(this.Overlay.style);
		if (dialog) {
			this.E.style.transform='translateX(100%)';
			if (caption)
				this.DE.Caption.textContent=caption;
			while(dialog.firstChild) this.DE.View.appendChild(dialog.firstChild);
			this.DE.style.display='flex';
		} else {
			this.DE.style.display='none';
			this.E.style.transform='translateX(0)';
		}
	}	// }}}
	close ()
	{	// hide aside bar {{{
		((S)=>{
			// CSS: { opacity:0; visiblity:hidden; }
			S.opacity=0;
			S.visibility="hidden";
		})(this.Overlay.style);
		while (this.DE.Caption.firstChild) this.DE.Caption.removeChild(this.DE.Caption.firstChild);
		while (this.DE.View.firstChild) this.DE.View.removeChild(this.DE.View.firstChild);
		// [CSS] transform: translateX(100%);
		this.E.style.transform="translateX(100%)";
	}	// }}}
	toggle ()
	{	// toggle aside bar {{{
		this["hidden" === this.Overlay.style.visibility ? "open" : "close"]();
	}	// }}}
}

class Slides
{
	constructor (RE)
	{	// {{{
		this.current=undefined;
		this.fontScale=1.0;
		this.NextSID=0;
		this.Plugins={}; // deprecated. Xs will replace this one by storing promise.
		this.Xs={};
		this.EventHook={};
		this.Content=RE.querySelector('#content');

		(()=>{ // install built-in style {{{
			const S=document.createElement("style")
			const PAGE=`
:root {--base-font-size:24px;}
* {box-sizing:border-box;}
html {font-size:var(--base-font-size);scroll-behavior:smooth;}
html, body {height:100%;}
body {margin:0;font-family:"Noto Sans TC","Microsoft JhengHei",system-ui,-apple-system,Segoe UI,Arial;color:#222;background:#fff;line-height:1.6;display:flex;flex-direction:column;opacity:0;}
`;
			const SECTION=`
#content {flex:1;padding:0;overflow:hidden auto;background:#f0f0f0;}
#content section {margin:1.5rem 1rem 1.5rem 1rem;scroll-snap-align:none;background:white;}
#content[playmode="page"] {margin:0;border:0;padding:0;overflow:hidden;scroll-snap-type:y mandatory;}
#content[playmode="page"] section {margin:0.5rem;height:calc(100% - 1rem);min-height:calc(100% - 1rem);padding:1.25rem;croll-snap-align:start;overflow-y:auto;scroll-margin-top:0.5rem;}
section {margin:1.75rem 0 2.25rem 0;padding:1.25rem;border:2px solid #e6e6e6;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,0.03);transition:border-color 0.4s ease,box-shadow 0.4s ease,background-color 0.4s ease;cursor:pointer;scroll-margin-top:1.5rem;}
section:hover {border-color:#ccc;}
section.current-section {border-color:#26A69A;background-color:#f6fffd;box-shadow:0 4px 16px rgba(38, 166, 154, 0.2);cursor:default;}
`;
			const BASIC=`
.title {font-size:clamp(1.75rem, 4vw, 2.5rem);font-weight:800;margin:0 0 0.375rem 0;color:#1E88E5;}
.subtitle {font-size:clamp(1rem, 2.4vw, 1.25rem);color:#666;margin:0;}
.hide {display:none;}
.frame {margin:16px 4px;padding:8px;border:2px dashed silver;border-radius:8px;background:#F0FFF0;}
h2 {margin:0 0 0.625rem 0;font-size:1.375rem;color:#1E88E5;}
h3 {margin:0.625rem 0;font-size:1.125rem;color:#0d5ea8;}
ul, ol {margin:8px 0 8px 22px;}
button {appearance:none;border:1px solid #cfd8dc;background:#fff;padding:8px 12px;border-radius:10px;cursor:pointer;font-size:95%;}
button:hover {border-color:#90a4ae;}
#content[playmode="page"] section.cm { display:flex;flex-flow:column nowrap;align-items:center;justify-content:center;}
#content[playmode="page"] section.full { margin:0;padding:0;border:0;height:100%;scroll-margin-top:0; }

[data-h] { cursor:pointer; }
[data-h]:hover { text-decoration:underline; }
[data-h="display"] { text-decoration:underline;color:blue; }
[data-h="display"] [caption] { display:none; }

.black { color:black; }
.grey { color:grey; }
.red { color:red; }
.green { color:green; }
.blue { color:blue; }
.brown { color:brown; }
.orange { color:orange; }
.purple { color:purple; }
`;
			S.innerHTML=PAGE+SECTION+BASIC;
			document.head.appendChild(S);
		})(); // }}}

		((E)=>{ // Launch PAD {{{
			E.id="control-panel";
			E.innerHTML=`
<style>
#control-panel {
	position:fixed;bottom:0;left:0;width:14vmin;padding:0.5vmin;z-index:10000;
	display:flex;flex-flow:row wrap;pointer-events:none;
}
#control-panel [data-h] {
	width:6vmin;height:6vmin;margin:0.2vmin;border-radius:0.2vmin;
	display:flex;justify-content:center;align-items:center;
	background-color:#3498db;color:white;
	font-weight:bold;font-size:3vmin;
	user-select:none;cursor:pointer;pointer-events:auto;
}
#control-panel>[data-h="none"] {background:rgba(0,0,0,0);border:1px solid silver;}
#control-panel:not(.active) :not([data-h="none"]) {display:none;}
</style>
<div data-h="prev">◀</div>
<div data-h="menu">☰</div>
<div data-h="none"> </div>
<div data-h="next">▶</div>
`;
			if (!E.__handler__) {
				E.__handler__ = (evt) => {
					const func=evt.target.dataset.h;
					switch(func){
					case 'none':
						E.classList.toggle('active');
						break;
					case 'menu':
						E.classList.remove('active');
						this.Aside.open();
						break;
					case 'prev':
						E.classList.remove('active');
						this.activate(-1, true);
						break;
					case 'next':
						E.classList.remove('active');
						this.activate(1, true);
						break;
					default:
						return;
					}
					evt.preventDefault();
				};
				E.addEventListener('click',E.__handler__);
				E.addEventListener('mouseover',(evt)=>E.classList.add('active'));
			}
			this.Content.appendChild(E);
		})(document.createElement("div")); // }}}

		this.Aside=new Aside(document.body);

		setInterval(()=>{ let eh=this.EventHook.tick; if(eh) for(let n in eh) eh[n](); },1000)
	}	// }}}
		
	async init (Args={})
	{	// async init {{{
		// Process <section>s in #content, and create this.Content

		const content=this.Content;

		// TODO
		if ('quizgen'===Args.f) {
			const CE=[];
			function aq(C,e) {
				const se=document.createElement("section")
				se.appendChild(e);
				C.push(se);
				return C;
			}
			function shuffle(array) {
				for (let i = array.length - 1; i > 0; i--) {
					const j = Math.floor(Math.random() * (i + 1));
					[array[i], array[j]] = [array[j], array[i]]; // Swap elements
				}
				return array;
			}
			Array.from(content.querySelectorAll('[data-x^="quiz:c"]')).reduce(aq, CE);
			Array.from(content.querySelectorAll('[data-x^="quiz:"]')).reduce(aq, CE);
			shuffle(CE); // TODO shuffle
			Array.from(content.querySelectorAll('section')).forEach((e)=>content.removeChild(e));
			CE.forEach((e)=>content.appendChild(e));
		}

		// TOREMOVE {{{
		await Promise.all(Array.from(content.querySelectorAll('[X]')).reduce((R,e)=>{
			R.push(this.applyX(e.getAttribute('X').split(':')[0],e));
			return R;
		},[]));
		// }}}

		await Promise.all(Array.from(content.querySelectorAll('[data-x]')).reduce((R,e)=>{
			R.push(this.applyX(e.dataset.x.split(':')[0],e));
			return R;
		},[]));

		// A. fix sections
		((selector) => {
			// filter sections, generate SIDs, and calc total number of pages
			content.Keywords={}; // content.Keywords : 所有定義的 Keywords
			content.PageCounts=Array.from(content.querySelectorAll('section')).reduce((r,s)=>{
				const ks=(s.dataset.ks||'').split(/[,\s]/).filter((v)=>v);
				ks.forEach((k)=>content.Keywords[k]=true);
				if (selector&&(!selector.find((ss)=>ss.reduce((r,k)=>(r && (ks.indexOf(k)>=0)),true)))) {
					// 直接刪除 DOM 內過濾掉的元素
					if (s.parentNode) s.parentNode.removeChild(s);
				} else {
					r++;
					s.id=`__slide_${r}__`;
				}
				return r;
			}, 0);

			content.Keywords=Object.keys(content.Keywords);
			((CE)=>{
				const opt=document.querySelector('[data-uid^="aside:Settings"] .Options');
				opt.innerHTML=content.Keywords.reduce((C,k)=>{
					return C+`<div><input type='checkbox'/> ${k}</div>`;
				},"");
				//selector.reduce((ks)=>{
				//});
				console.log(CE,content.Keywords,selector);
			})(document.body.querySelector('aside .Setting.Pages'));

			// fill title values
			((te)=>{
				if (te) return;
				document.head.appendChild(te=document.createElement('title'));
				te.textContent=Args.title||(
					content.querySelector('.title')||content.querySelector('h1')||content.querySelector('h2')||{textContent:"Presentation"}
				).textContent;
			})(document.head.querySelector('title'));
		})(Args.s);

		// B. install styles for sections
		content.insertBefore(((s)=>{
			s.innerHTML=`
.cb { white-space: nowrap; padding-left:3vw; font-weight:bolder; overflow-x:auto; }
`;
			return s;
		})(document.createElement("style")),content.firstChild);

		if (!content.__handler__) {
			content.__handler__ = (evt)=>{
				for (let e=evt.target; e!==content; e=e.parentNode){
					if (e.dataset.h) {
						const args=e.dataset.h.split(':'), cmd=args.shift();
						if (cmd in this && 'function' === typeof(this[cmd])) {
							this[cmd].apply(this,args).then(console.log,console.log);
						} else continue;
						evt.stopPropagation();
						// evt.preventDefault(); // default handler essential to change events
						break;
					}
					if (e.tagName==='SECTION') { this.activate(e, true); break; }
				}
			};
			content.addEventListener('click', content.__handler__);
			content.addEventListener('change', content.__handler__);
		}

		content.addEventListener('scrollend', (evt) => { // auto activate page when current slide out of viewport
			let s,x=this.Content.getBoundingClientRect().height/3;
			for (s=this.Content.firstChild; s; s=s.nextSibling) if(s.nodeType===1) {
				const eb=s.getBoundingClientRect();
				if ((eb.y+eb.height)>x) break;
			}
			if (s&&document.fullscreenElement) this.activate(s);
		});
		console.log("INIT Completed");
	}	// }}}

	get (section)
	{	// get section element by hints (1,-1,"id") {{{
		switch (section) {
		case 1 :
			for (let s=this.current.nextSibling; s; s=s.nextSibling)
				if (s.tagName === 'SECTION') return s;
			return;
		case -1 :
			for (let s=this.Content.firstChild,h=[]; s; s=s.nextSibling)
				if (s.tagName === 'SECTION') {
					if (s === this.current) return h.pop(); else h.push(s);
				}
			return;
		default:
			if ('string' === typeof(section))
				section = this.Content.querySelector(`#${section}`); 
			return section;
		}
	}	// }}}

	activate (section, scroll)
	{	// activate specified section {{{
		section = this.get(section);
		if (!section) return;

		if (section !== this.current) {
			this.current=section;

			// move .current-section to new section element
			Array.from(
				section.parentNode.querySelectorAll('.current-section')
			).forEach((s)=>s.classList.remove('current-section'));
			section.classList.add('current-section');

			//if (this.Plugins.TeX) this.Plugins.TeX.resolve(section).then(console.log,console.log);

			if (this.Aside)
				this.Aside.update(
					parseInt(/__slide_([0-9]+)__/.exec(section.id)[1]),
					section.parentNode.PageCounts
				);

			// Update URL hash and scroll into view
			if (history.replaceState)
				history.replaceState(null, null, '#' + section.id);
			else location.hash = '#' + section.id;

			if (scroll !== undefined) {
				setTimeout(() => {
					this.current.scrollIntoView({
						behavior: scroll ? 'smooth' : 'auto',
						block: 'start'
					});
					this.current.scrollTop=0;
					// Do we need focus() ? 
					// setTimeout(()=>(this.Content.getAttribute('playmode')==='page'?this.current:this.Content).focus(),1000);
				}, 1);
			}
		}
	}	// }}}

	set (name, value)
	{	// set/unset parameters {{{
		switch (name) {
		case 'pagemode':
			this.Content.setAttribute("playmode",value ? "page" : "continuous");
		}
	}	// }}}

	regEventHook (cat, name, handler)
	{	// (un)schedule a tick callback {{{
		let eh=this.EventHook[cat]||(this.EventHook[cat]={});
		if(handler) eh[name]=handler;
		else delete eh[name];
	}	// }}}

	async install (name, handler)
	{	// install page plugin {{{
		this.Plugins[name]=await Promise.resolve(handler(this));
	}	// }}}

	async applyX (name, e) // apply eXtension
	{
		if (!this.Xs[name])
			this.Xs[name] = name in Plugins ?
				Promise.resolve(Plugins[name](this)) :
				loadScript(currentScript.getAttribute("src").replace(/\.js/,`_${name}.js`)) ;
		(await this.Xs[name])(this,e);
	}

	handleAction (e)
	{ // {{{
		(e.dataset.h||"").split(";").forEach((a)=>{
			a=(a||"").split(',');
			const cmd=a[0]; a[0]=e;
			if(cmd) this[cmd].apply(this,a);	
		});
	}	// }}}

	tab (e, name='tab', cls='hide')
	{ // <select data-h='tab,tab,hide'> {{{
		const key=e.value;
		let se=this.Content;
		for (se=e;se&&se.tagName!=='SECTION';se=se.parentNode);
		for (let te of Array.from(se.querySelectorAll(`[${name}]`)))
			te.classList[te.getAttribute(name)===key ? 'remove' : 'add'](cls);
	} // }}}

	speak (te, lang='en')
	{	// <span data-h='speak,fr'>bonjour</span> {{{
		let e,text;
		for(e=event.target;e!==te&&(!e.hasAttribute('x'));e=e.parentNode);
		text=e.getAttribute('text') || e.textContent;
		text=text.replaceAll(/[🔈]/g,'').split(/\s+/).filter((v)=>v).join(' ');
		if ('speechSynthesis' in window) {
			const utterance = new SpeechSynthesisUtterance(text);
			utterance.lang = lang; // 根據語言代碼設定發音引擎
			utterance.rate = (lang.startsWith('ko')||lang.startsWith('ja')) ? 1.0 : 0.8;
			speechSynthesis.speak (utterance);
			if (e.getAttribute('x'))
				alert(e.getAttribute('x').replace(/;/,'\n')+'\n'+text);
        } else alert('您的瀏覽器不支援 Speech Synthesis API。');
    }	// }}}

	goto (e, key)
	{	// <button data-h='goto,keyword'> {{{
		let ts=this.Content.querySelector(`section[data-ks~="${key}"]`);
		console.assert(ts,'goto() => target not found');
		if (ts) ts.click();
	}	// }}}

	async dialog (mtype, tgt, capt)
	{	// {{{
		const de=document.createElement("div");
		de.appendChild(document.createElement("div"));
		de.firstChild.style.overflow="auto";
		de.firstChild.style.width=de.firstChild.style.height="100%";

		switch (mtype) {
		case 'mermaid':
			de.firstChild.setAttribute('style', 'text-align:center');
			await this.Plugins.TeX.renderMermaid(de.firstChild, tgt);
			break;
		case 'image':
			de.firstChild.outerHTML=`<div style='overflow:hidden;height:100%;'><img src='${tgt}' style='object-fit:cover;width:auto;height:auto;'/></div>`;
			((v)=>{
				const img=v.querySelector('img');
				img.addEventListener('load',()=>{
					const cr=v.getBoundingClientRect();
					const as=(img.width*cr.height > img.height*cr.width) ? ['height','overflow-x'] : ['width','overflow-y'];
 					img.style[as[0]]='100%';
					v.style[as[1]]='auto';
				});
			})(de.firstChild);
			break;
		case 'photo':
			de.firstChild.outerHTML=`<div style='overflow:hidden;display:flex;justify-content:center;align-items:center;height:100%;'><img src='${tgt}' style='object-fit:contain;width:100%;height:100%;'/></div>`
			break;
		case 'obj':
			de.firstChild.outerHTML=`<div style='overflow:hidden;display:flex;justify-content:center;align-items:center;height:100%;'><iframe src='${tgt}' style='width:100%;height:100%;'><a href='${tgt}'>Not support, download to open</a></iframe></div>`
			break;
		default:
			if (code.nodeType===1) de.firstChild.appendChild(code); else return;
			break;
		}
		de.firstChild.addEventListener('click',(evt)=>{
			for (let e=evt.target; e.nodeType===1; e=e.parentNode){
				if (e.dataset.h) {
					console.log(e.dataset.h)
					evt.stopPropagation();
					evt.preventDefault();
				}
			}
		});
		return this.Aside.open(de, capt||"");
	}	// }}}

	async show (e, code)
	{	// <button data-h='show,RID_Key'> {{{
		//console.log(this.Plugins.TeX.resolve());
		let lang = e.getAttribute('lang');
		if (!code) code = e.getAttribute('code');
		if (code) {
			if (!lang) {
				lang=document.body.querySelector(`[RID="${code}"]`);
				code=lang.value || lang.cloneNode(true); 
				lang=lang.getAttribute('lang');
			}
		} else {
			code=e.querySelector('[caption]');
			if (code) return this.Aside.open(code.cloneNode(true));
		}
			
		const de=document.createElement("div");
		de.appendChild(document.createElement("div"));
		de.firstChild.style.overflow="auto";
		de.firstChild.style.width=de.firstChild.style.height="100%";

		switch (lang) {
		case 'mermaid':
			de.firstChild.setAttribute('style','text-align:center');
			await this.Plugins.TeX.renderMermaid(de.firstChild,code);
			break;
		case 'image':
			de.firstChild.outerHTML=`<div style='overflow:hidden;height:100%;'><img src='${code}' style='object-fit:cover;width:auto;height:auto;'/></div>`;
			((v)=>{
				const img=v.querySelector('img');
				img.addEventListener('load',()=>{
					const cr=v.getBoundingClientRect();
					const as=(img.width*cr.height > img.height*cr.width) ? ['height','overflow-x'] : ['width','overflow-y'];
 					img.style[as[0]]='100%';
					v.style[as[1]]='auto';
				});
			})(de.firstChild);
			break;
		case 'photo':
			de.firstChild.outerHTML=`<div style='overflow:hidden;display:flex;justify-content:center;align-items:center;height:100%;'><img src='${code}' style='object-fit:contain;width:100%;height:100%;'/></div>`
			break;
		case 'obj':
			de.firstChild.outerHTML=`<div style='overflow:hidden;display:flex;justify-content:center;align-items:center;height:100%;'><iframe src='${code}' style='width:100%;height:100%;'><a href='${code}'>Not support, download to open</a></iframe></div>`
			break;
		default:
			if (code.nodeType===1) de.firstChild.appendChild(code); else return;
			break;
		}

		de.setAttribute('caption',e.getAttribute('caption')||"");
		de.firstChild.addEventListener('click',(evt)=>{
			for (let e=evt.target; e.nodeType===1; e=e.parentNode){
				if (e.dataset.h) {
					this.handleAction(e);
					evt.stopPropagation();
					evt.preventDefault();
				}
			}
		});
		return this.Aside.open(de);
	}	// }}}
}

document.addEventListener('DOMContentLoaded', async () => { // {{{
	const loading = document.createElement("div");
	loading.beginTS = (new Date()).getTime();
	loading.style.textAlign = 'center';
	loading.textContent = 'Loading ...';
	document.body.insertBefore(loading,document.body.firstChild);

	// 1. Create {args} according to {location.search}
	const args = (location.search||'?').substr(1).split('&').reduce((r,a) => {
		const pa = /^([^=]+)=(.*)$/.exec(a);
		if (pa) {
			switch (pa[1]) {
			case 's' :
				r[pa[1]] = decodeURIComponent(pa[2]).split('|').map((v) => v.split('.'));
				break;
			default:
				r[pa[1]] = decodeURIComponent(pa[2]);
				break;
			}
		} else r[a] = true;
		return r;
	}, {});

	// 2. Create Slide Instance
	let MS = window.App = new Slides(document.body);
	await MS.init(args);

	// 3. Install slide plugins
	for (const name of (CS.getAttribute('plugins')||"").split(',')) {
		if (name in Plugins)
			await MS.install(
				name,
				Plugins[name]
			);
		else if(name)
			await MS.install(
				name,
				await loadScript(currentScript.getAttribute("src").replace(/\.js/,`_${name}.js`))
			);
	}
	MS.Aside.install(MS.Content);

	// 4. Bind Events
	document.addEventListener('fullscreenchange', () => {
		if (document.fullscreenElement) {
			MS.set('pagemode', true);
			MS.Aside.update();
			MS.Aside.close();
			setTimeout(() => MS.current.click(), 1000);
		}
	});

	window.addEventListener('keydown', (e) => {
		if (e.key==='ArrowLeft') {
			MS.get(-1).click();
		} else if (e.key==='ArrowRight') {
			MS.get(1).click();
		} else if (e.key==='Escape')
			MS.Aside.toggle();
		else return;
		e.preventDefault();
	});
	document.applyFontSize=(scale)=>{
		const DEFAULT_FONT_SIZE=(
			(w,h)=>w>h ? Math.floor(h/26) : Math.floor(w/30)
		)(
			window.innerWidth,
			window.innerHeight
		);
		document.documentElement.style.setProperty(
			'--base-font-size',
			`${DEFAULT_FONT_SIZE * scale}px`
		);
	};
	window.addEventListener('resize', (e) => document.applyFontSize(1.0));

	// 5.1 Initialize the font size of play session
	document.applyFontSize(1.0);
	// 5.2 Initialize the page hash to latest viewed page
	setTimeout( (section) => {
		MS.get(section).click();
		loading.parentNode.removeChild(loading);
		document.body.style.opacity='1';
		console.log(`${(new Date()).getTime()-loading.beginTS} elapsed.`);
	}, 1, MS.Content.querySelector(location.hash ? `section#${location.hash.substr(1)}` : "section"));
});	// }}}

})(document.currentScript);
