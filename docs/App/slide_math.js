(function(SCRIPT){

const prefix=/(.*\/)([^\/]+)(\?.*)?/.exec(SCRIPT.src);
function loadScript (url,init) {
	return new Promise((or,oe)=>{
		let se=document.createElement('script');
		se.addEventListener('load',()=>init(se).then(or,oe));
		se.src=prefix[1]+url;
		document.head.appendChild(se);
	});
}

window.MathJax = {
	tex: {
		inlineMath: [['$', '$'], ['\\(', '\\)']],
		displayMath: [['$$', '$$'], ['\\[', '\\]']]
	}
};

const Init=loadScript ('js/tex-mml-chtml.js',async (SE) => {
	return MathJax;
}); // https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js

SCRIPT.value=async function (slide,elem) {
	await (await Init).typesetPromise([elem]);
};

})(document.currentScript);
