(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.FocusQuoteEngine=factory()})(typeof window==='undefined'?globalThis:window,()=>class QuoteEngine{
 constructor(quotes,seen=[],random=Math.random){this.quotes=quotes;this.seen=new Set(seen);this.random=random}
 next(){const unread=this.quotes.filter(q=>!this.seen.has(q.id));if(!unread.length)return null;const quote=unread[Math.min(unread.length-1,Math.floor(this.random()*unread.length))];this.seen.add(quote.id);return quote}
 get remaining(){return this.quotes.filter(q=>!this.seen.has(q.id)).length}
});
