((SE)=>{
	SE.value=async function (content) {
		console.log("Quiz.Gen");
		const CE=[];
		function aq(C,e) {
			const se=document.createElement("section")
			se.appendChild(e);
			C.push(se);
			return C;
		}
		Array.from(content.querySelectorAll('[data-x^="quiz:c"]')).reduce(aq, CE);
		Array.from(content.querySelectorAll('[data-x^="quiz:"]')).reduce(aq, CE);
/*
		function shuffle(array) {
			for (let i = array.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[array[i], array[j]] = [array[j], array[i]]; // Swap elements
			}
			return array;
		}
		shuffle(CE); // TODO shuffle
*/
		Array.from(content.querySelectorAll('section')).forEach((e)=>content.removeChild(e));
		CE.forEach((e)=>content.appendChild(e));
	};
})(document.currentScript);
