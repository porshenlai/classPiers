(function(SCRIPT){

function findParent (e,cs) {
	try {
		while (!e.matches(cs))
			e=e.parentNode;
	} catch(x) { return undefined; }
	return e;
}

class Cards
{	
//	<div style='display:flex;flex-flow:row wrap;gap:1vw 2%;'>
//		<div X='Card' style='width:32%;padding-top:32%;'>
//			<div class='front'> 正面 </div>
//			<div class='back'> 背面 </div>
//		</div>
//	</div>
	constructor (app) {
		if (!document.head.querySelector('style[STYID="Card"]'))
			(()=>{ // install CSS {{{
				const SE=document.createElement("style");
				SE.setAttribute('STYID','Card');
				SE.innerHTML=`
[data-x="card"] {
	background-color:transparent;
	width:30%;
	height:0;
	padding-top:30%;
	border:1px solid #f1f1f1;
	perspective:1000px;
}
[data-x="card"] .front,
[data-x="card"] .back {
	position:absolute;
	width:100%;
	height:100%;
	overflow:hidden auto;
	backface-visibility:hidden;
}
[data-x="card"] .front {
	background-color:#bbb;
	color:black;
}
[data-x="card"] .back {
	background-color:#2980b9;
	color:white;
	transform:rotateX(180deg);
}
[data-x="card"]>div {
	position:absolute;
	left:0; top:0; width:100%; height:100%;
	text-align:center;
	transition:transform 0.6s;
	transform-style:preserve-3d;
	box-shadow:0 4px 8px 0 rgba(0,0,0,0.2);
}
[data-x="card"]>div.flipped {
	transform: rotateX(180deg);
}
`;
				document.head.appendChild(SE);
			})(); // }}}
	}
	install (E) {
		const bc=E.querySelector('.back');
		const inner=((e)=>{ // add flip layer
			if (e===E){
				e=document.createElement("div");
				while (E.firstChild) e.appendChild(E.firstChild);
				E.appendChild(e);
			}
			return e;
		})(bc.parentNode);

		if (!E._card_on_click_) { // install event handler
			E._card_on_click_= (evt) => {
				let e=findParent(evt.target,'[data-x="card"]>div');
				if (e) e.classList.toggle('flipped');
				evt.stopPropagation();
			};
			E.addEventListener('click', E._card_on_click_);
		}
		E.classList.remove('flipped'); // remove, toggle
	}
}

let H=undefined;

SCRIPT.value=async function (slide, elem) {
	if (!H) H=new Cards(slide);
	H.install(elem);
	return H;
};

})(document.currentScript);
