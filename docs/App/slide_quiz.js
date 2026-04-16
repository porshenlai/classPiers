(function(SCRIPT){

function findParent (e,cs) {
	try {
		while (!e.matches(cs))
			e=e.parentNode;
	} catch(x) { return undefined; }
	return e;
}

class Quiz
{	// Quiz Plugin
	constructor (app)
	{
		this.QEs={};
		if (!document.head.querySelector('style[data-cssid="Quiz"]')) (() => {
			const SE=document.createElement("style"); // install style for Quiz
			SE.dataset.cssid='Quiz';
			SE.innerHTML=`
[data-x^="quiz:"] select {
	font-size:100%;
}
[data-x^="quiz:"] [data-o] {
	padding:.3vw;
	margin:.1vw;
	border:1px solid lightgrey;
	background-image:linear-gradient(white 60%,lightgrey);
}
[data-x^="quiz:"] [data-o]:hover {
	border-color:grey;
	background-image:linear-gradient(white 60%,grey);
}
[data-x^="quiz:"] {
	border:1px solid blue;
	border-radius:.5vw;
	padding:.3vw;
	margin:.1vw 0;
}
[data-x^="quiz:"].QRX {
	border-color:red;
	background-image:linear-gradient(to right,white 60%,pink);
}
[data-x^="quiz:"].QRO {
	border-color:green;
	background-image:
	linear-gradient(to right,white 60%,lightgreen);
}

[data-x^="quiz:"] .cols { display:flex; flex-flow:rows nowrap; }
[data-x^="quiz:"] .cols>div { flex:1 1 auto;text-align:center; }

[data-x^="quiz:"].QRO [data-o]:not(.QS),
[data-x^="quiz:"]:not(.QRO) .answer,
[data-x^="quiz:"].QR_>:not(.HT),
[data-x^="quiz:"]:not(.QR_)>.HT
{ display:none; }

[data-x^="quiz:"] :not([data-o="value"]).QS {
	color:blue;
	font-weight:bolder;
}
.HT { border:1px outset silver;padding:2px;text-align:center; }
`;
			document.head.appendChild(SE);
		})();

		// install utilities services of Quiz.
		if (app) app.Aside.installSetting((()=>{
			const E=document.createElement("div");
			E.innerHTML=`<div data-uid="aside:Settings:Quiz">
	<label>QUIZ</label>
	<div class='Options'>
		<button data-h='downloadDLC'>下載數位學院CSV</button>
	</div>
</div>`;
			E.addEventListener('click',(evt)=>{
				for (let e=evt.target; e!==E; e=e.parentNode) {
					switch (e.dataset.h) {
					case 'downloadDLC':
						this.downloadDLC();
						break;
					}
					evt.stopPropagation();
					evt.preventDefault();
				}
			});
			return E;
		})());
	}
	saveCSV (aa) {
		const rst=aa.map((row)=>('"'+row.map((v)=>v.replaceAll('"','""')).join('","')+'"')).join('\n');
		((ae)=>{
			const url=URL.createObjectURL(new Blob([rst],{"type":"text/csv;charset:utf8"}));
			ae.href=url;
			ae.download='quiz.csv';
			document.body.appendChild(ae);
			ae.click();
			document.body.removeChild(ae);
			window.URL.revokeObjectURL(url);
		})(document.createElement('a'));
	}
	downloadDLC (tag='2025-0-1-0-0') {
		let table=[];
		for (let k in this.QEs) {
			let q=this.QEs[k];
			// 題目類型(2:單選,3:複選,6:組合),
			// 答案({a:1},{b:2}),
			// 問題,
			// 選項(A||B@@1||2),
			// 說明,
			// 標籤(2025-0-3-0-0),
			// 難易度(3)
			let xq=q.cloneNode(true), qt=xq.getAttribute('qt'), xo, difficulty="3", explain="";
			xo=Array.from(xq.querySelectorAll('[data-o]')).reduce((r,e)=>{
				r.push(e.textContent);
				e.parentNode.removeChild(e);
				return r;
			},[]).join(" || ");
			explain=Array.from(xq.querySelectorAll('.answer')).reduce((r,e)=>{
				r.push(e.innerHTML);
				e.parentNode.removeChild(e);
				return r;
			},[]).join("\n");
			table.push([
				qt==='m'?'3':'2',
				((a)=>{
					if (qt==='s') return a;
					let ta=[];
					for (let i=1,j=1; i<a; i*=2,j++)
						if ((a&i)>0) ta.push(j);
					return ta.join(',');
				})(xq.getAttribute('___')),
				xq.innerHTML.trim(), xo, explain, tag, difficulty
			]);
		}
		this.saveCSV(table);
	}

	async __sha256__ (str) {
    	const hashBuffer = await crypto.subtle.digest(
			'SHA-256',
			(new TextEncoder()).encode(str)
		);
    	return Array.from(new Uint8Array(hashBuffer));
	}

	__toHex__ (arr) {
    	return arr.map(b => b.toString(16).padStart(2, '0')).join('')
	}

	__setStatus__ (qe, v) {
		const p=/QR?/;
		Array.from(qe.classList)
			.filter((s)=>p.exec(s))
			.forEach((s)=>qe.classList.remove(s));
		qe.classList.add(`QR${v}`);
	}

	install (e) {
		if (undefined===e._K_) e._K_=`${new Date().getTime().toString(36)}${Object.keys(this.QEs).length}`;
		if (e._K_ in this.QEs) return;

		this.QEs[e._K_]=e;

		if (!e._Q_on_click_) {
			e._Q_on_click_=(evt)=>{
				try {
					let e=evt.target;
					while (e) {
						if (e.matches('[data-o]')) {
							if (e.getAttribute('data-o')!=='value') {
								evt.preventDefault();
								evt.stopPropagation();
								this.answer(e);
							}
							break;
						}else
						if (e.matches('.HT')) {
							this.__setStatus__(findParent(e,'[data-x^="quiz:"]'), '-');
							break;
						}
						e=e.parentNode;
					}
				} catch (x) {}
			}
			e.addEventListener('click',e._Q_on_click_);
		}
		if (!e._Q_on_change_) {
			e._Q_on_change_=(evt)=>{
				let v=evt.target.dateset.o
				if(v==='value') {
					evt.preventDefault();
					evt.stopPropagation();
					evt.target.classList.remove('QS');
					this.answer(evt.target,evt.target.value);
				}
			}
			e.addEventListener('change',e._Q_on_change_);
		}
		return this;
	}
	answer (e, v)
	{
		// locate the quiz block
		e=findParent(e,'[data-o]');
		const p=findParent(e,'[data-x^="quiz:"]');
		if (!p) return;
		switch (p.dataset.x.substring(5)) {
		case 's':
			if (e.classList.contains('QS')) {
				console.log("RESET");
				// click selected one, clear all
				Array.from(p.querySelectorAll('.QS'))
					.forEach((e)=>e.classList.remove('QS'));
				this.__setStatus__(p, '-');
			} else {
				// click new answer, clear all, then select this one
				Array.from(p.querySelectorAll('.QS'))
					.forEach((e)=>e.classList.remove('QS'));
				e.classList.add('QS');
				this.__setStatus__(p, e.dataset.o.substring(0,1));
			}
			break;
		case 'm':
			(()=>{
				e.classList.toggle('QS'); // toggle the flag of this answer
				const re1 = Array.from(e.parentNode.querySelectorAll('[data-o].QS'))
					.reduce((r,e) => r&&e.dataset.o==='O',true);
				const re2 = Array.from(e.parentNode.querySelectorAll('[data-o]:not(.QS)'))
					.reduce((r,e) => r&&e.dataset.o==='X',true);
				this.__setStatus__(p, re1 && re2 ? 'O' : 'X');
			})();
			break;
		case 'sort':
			(()=>{
				let c=e.parentNode;
				e.classList.toggle('QS'); // toggle the flag of this answer
				if (e.classList.contains('QS'))
					c.insertBefore(e,c.querySelector('[data-o]:not(.QS)'));
				else c.appendChild(e);
				const re1 = 0 == Array.from(p.querySelectorAll('[data-o].QS'))
					.reduce((r,e,i) => r+Math.abs(parseInt(e.dataset.o)-i), 0);
				const re2 = Array.from(c.querySelectorAll('[data-o]:not(.QS)'))
					.reduce((r,e) => r&&e.dataset.o==='-',true);
				this.__setStatus__(p, re1 ? re2 ? 'O' : '-' : 'X');
			})();
			break;
		}
	}
	mark () {
		// submit all the replied answers
		return [... this.E.querySelectorAll('[_K_]')].reduce((r,e)=>{
			r[e.getAttribute('_K_')]=e.getAttribute('qa');
			return r;
		},{});
	}
}

let H=undefined;
SCRIPT.value=async function (slide,elem) {
	if (!H) H=new Quiz(slide);
	H.install(elem);
};


})(document.currentScript);
