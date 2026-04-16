(function(SCRIPT){

//	<div X="Player:?" audio='' video=''>
//		<div s='0'>World</div>
//		<div s='30' d='150'>World</div>
//		<div d='30'>World</div>
//	</div>
// s,d => unit
// s {d, d, d, d} => unit

class Player
{
	constructor (e) {
		this.E=e;
/*
		// generate plan lists
		this.ALs=[]; // <div class='af' dur='...'>...</div>
		this.MLs=[]; // <div class='af' [action='...']>...</div>
		this.MLs.Cur=-1;
		this.Guide=undefined; // <div class='af' dur='0'>...</div>
		this.Ms=[]; // <audio>...</audio> | <video>...</video>
		this.Ms.Cur=-1;
		for (let e=this.E.firstChild;e;e=e.nextSibling) {
			if (e.nodeType!==1) continue;
			if (e.classList.contains('af')) {
				let dur=e.getAttribute('dur');
				if (dur!==null) {
					if ((''+dur)==='0')
						this.Guide=e;
					else this.ALs.push(e);
				} else this.MLs.push(e);
			} else if (/AUDIO|VIDEO/.exec(e.tagName)) {
				e.addEventListener('ended', ()=>this.stop(e)); // 處理單曲播放結束
				this.Ms.push(e);
			}
		}

		this.E.addEventListener('click', (event) => {
			let e,f;
			for(e=event.target;e&&e!==this.E;e=e.parentNode){
				const f=e.getAttribute("action");
				if (f) switch (f) {
					case 'next': this.flip(1); break;
					case 'prev': this.flip(-1); break;
					case 'stop': case 'pause': this.stop(); break;
					case 'play': this.start(); break;
					case 'seek': this.seek(); break;
				}
			}
		});

		(()=>{ // duration auto control preparation
			let t=0;
			for (let e of this.ALs) {
				let dur=(e.getAttribute("dur")||"").split('-');
				if (!dur[0]) continue;
				if (!dur[1]) {
					e.repeat=true;
					e.dur=[t,t+parseFloat(dur[0]),true];
					t=e.dur[1];
				} else e.dur=[parseInt(dur[0]),parseInt(dur[1]||'0')];
			}
			for (let e of this.ALs) if (e.dur&&e.dur[2]) e.dur[2]=t;
		})();
		this.stop();
*/
	}

	getTS () {
		if (this.Ms[this.Ms.Cur])
			return (this.Ms.Shift||0)+this.Ms[this.Ms.Cur].currentTime;
		return ((new Date()).getTime()-this.ALs.StartTS)/1000;
	}

	start () {
		this.ALs.StartTS=new Date().getTime();
		this.Guide.style.zIndex='-9000';
		if (this.Ms.length>0) {
			for (let e of this.Ms) e.pause();
			const id=this.E.getAttribute('ani');
			this.Slide.regEventHook('tick',this.ID,()=>this.sync(this.getTS()));
			this.Slide.regEventHook('section',this.ID,()=>this.stop());
			this.Ms[this.Ms.Cur=0].play();
		}
		if (this.MLs.length>0) { this.MLs.Cur=-1; this.flip(1); }
	}

	stop (e) {
		if (e) {
			e.pause();
			let n=1+this.Ms.indexOf(e);
			if (n<this.Ms.length) {
				n=this.Ms[this.Ms.Cur=n];
				this.Ms.Shift=0;
				for (e of this.Ms){ if (e==n) break; else this.Ms.Shift+=e.duration; }
				return n.play();
			}
			if (n<this.Ms.length) return this.Ms[this.Ms.Cur=n].play();
		} else for (let e of this.Ms) e.pause();
		this.Slide.regEventHook('tick',this.ID);
		this.Slide.regEventHook('section',this.ID);
		delete this.StartTS;
		// fill-in video information
		const ms=this.Ms[this.Ms.Cur];
		if(ms) Array.from(this.Guide.querySelectorAll('[dvalue]')).forEach((e)=>{
			e.textContent=((name)=>{
				switch(name){
				case 'duration': return Math.floor(ms.duration);
				case 'position': return Math.floor(ms.currentTime);
				case 'ratio': return Math.floor(100*ms.currentTime/ms.duration);
				case 'url': let s=ms.querySelector('[src]'); return s ? s.getAttribute("src") : "";
				}
			})(e.getAttribute('dvalue'));
		});
		this.Guide.style.zIndex='9000';
	}

	seek () {
		const m=this.Ms[this.Ms.Cur];
		if (!m) return;
		m.currentTime=window.prompt(
			`Total length of media is ${m.duration}, current at:`,
			m.currentTime
		);
	}

	activate (e) {
		e.setAttribute("transition", ['slide','zoom','reveal'][Math.floor(Math.random()*3)]);
		setTimeout(()=>e.classList.add('active'), 0);
	}

	sync (ts) {
		if (this.Ms[this.Ms.Cur].paused) return;
		for (let e of this.ALs) if (e.dur) {
			let focus=false;
			const B=e.dur[0],E=e.dur[1],D=e.dur[2];
			if ((B<=ts && ts<E)||(Math.floor((ts-B)/D)>Math.floor((ts-E)/D)))
				focus=true;
			else if (0==E && (B<=ts && ts<B+1)) {
				// B+1: use 1 second to capture the edge event, this may result the multiple capture problem.
				this.Ms[this.Ms.Cur].pause();
				focus=true;
			}
			if (focus) {
				if (!e.classList.contains('active')) 
					this.activate(e);
			} else e.classList.remove('active');
		}
	}

	flip (shift) {
		let cur=this.MLs.Cur+shift;
		if(cur<0) cur=this.MLs.length-1;
		if(cur>=this.MLs.length) cur=0;
		this.MLs.Cur=cur;
		this.MLs.forEach((fr) => fr.classList.remove('active'));
		this.activate(this.MLs[cur]);
	}
}

class Players
{
	constructor (slide) {
		this.Ps={};
		this.Slide=slide;

		if (!document.head.querySelector('style[STYID="Anim"]')) (()=>{ // install style
			const se=document.createElement('style');
			se.setAttribute("STYID","Player");
			se.innerHTML=`
[ani] {width:100%;padding-top:50%;height:0;overflow:hidden;position:relative;}
[playmode="page"] [ani] { padding:0;height:100%;}
.af {position:absolute;left:0;top:0;right:0;bottom:0;opacity:0;transform:scale(1.1);z-index:0;}
.af[dur="0"] {background:white;opacity:1;z-index:-9000;transform:scale(1);}
.af.active {opacity:1;transform:scale(1);z-index:100;}
.af[transition="slide"] {transition:all 1s ease-in-out;transform:translateX(100%);}
.af[transition="slide"].active {transform:translateX(0);}
.af[transition="zoom"] {transition:all 1s ease-in-out;transform:scale(1.5);opacity:0;}
.af[transition="zoom"].active {transform:scale(1);opacity:1;}
.af[transition="reveal"] {transition:all 1s ease-in-out;clip-path:circle(0% at 0 0);}
.af[transition="reveal"].active {clip-path:circle(150% at 0 0);}
.af img {width:100%;height:100%;object-fit:contain;}
`;
			document.head.appendChild(se);
		})();
	}
	install (elem) {
		const pid=((s)=>{
			return s.length>7 ? s.substring(7) : (Object.keys(this.Ps).length+1);
		})(elem.getAttribute("X"));
		if (!(pid in this.Ps)) this.Ps[pid]=new Player(elem);
	}
}

let H=undefined;

SCRIPT.value=async function (slide, elem) {
	if (!H) H=new Players(slide);
	H.install(elem);
//		r[e.getAttribute('ani')]=new Player(e,slide);
};

})(document.currentScript);
