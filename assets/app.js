/* Navegação e interações locais. Nenhum dado é enviado ou alterado. */
(()=>{
'use strict';
document.documentElement.classList.add('js');
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const brl=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});

// Animações discretas de entrada; o conteúdo permanece visível sem JavaScript.
const reveals=$$('.reveal');
if('IntersectionObserver' in window&&!reduced){
 const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in-view');observer.unobserve(e.target)}}),{threshold:.07});
 reveals.forEach(e=>observer.observe(e));
}else reveals.forEach(e=>e.classList.add('in-view'));
$$('[data-counter]').forEach(el=>{
 const target=Number(el.dataset.counter);if(reduced||!Number.isFinite(target))return;
 const start=performance.now();function tick(now){const t=Math.min(1,(now-start)/1100);el.textContent=Math.round(target*(1-Math.pow(1-t,3)));if(t<1)requestAnimationFrame(tick)}requestAnimationFrame(tick);
});

const menu=$('#nav-menu'),menuButton=$('#menu-button');
menuButton?.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';menuButton.setAttribute('aria-expanded',String(open));menu.classList.toggle('is-open',open)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menuButton){menuButton.setAttribute('aria-expanded','false');menu?.classList.remove('is-open')}});

// Comparação mensal: conteúdo, valores e listas já vêm dos resultados calculados.
function selectMonth(month){
 $$('[data-month-block]').forEach(b=>{b.hidden=b.dataset.monthBlock!==month});
 $$('[data-month-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.monthChoice===month)));
 const live=$('#comparison-live');if(live){const chosen=$('[data-month-block="'+month+'"]');live.textContent=chosen?.dataset.announcement||''}
}
$$('[data-month-choice]').forEach(b=>b.addEventListener('click',()=>selectMonth(b.dataset.monthChoice)));
$$('[data-view-toggle]').forEach(b=>b.addEventListener('click',()=>{
 const block=b.closest('[data-month-block]'),table=$('.data-table-view',block),chart=$('.bars-view',block);const show=table.hidden;
 table.hidden=!show;chart.hidden=show;b.textContent=show?'Ver em barras ↔':'Ver em tabela ↔';b.setAttribute('aria-pressed',String(show));
}));

// Abas de produto e mercado com suporte a teclado.
const tabs=$$('[role="tab"]');
function activateTab(button,focus=false){
 tabs.forEach(b=>{const active=b===button;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;const panel=document.getElementById(b.getAttribute('aria-controls'));if(panel)panel.hidden=!active});if(focus)button.focus();
}
tabs.forEach((b,i)=>{b.addEventListener('click',()=>activateTab(b));b.addEventListener('keydown',e=>{
 let n;if(e.key==='ArrowRight')n=(i+1)%tabs.length;if(e.key==='ArrowLeft')n=(i-1+tabs.length)%tabs.length;if(e.key==='Home')n=0;if(e.key==='End')n=tabs.length-1;if(n!==undefined){e.preventDefault();activateTab(tabs[n],true)}
})});
if(tabs.length)activateTab(tabs[0]);
$$('[data-open-tab]').forEach(link=>link.addEventListener('click',()=>{const target=tabs.find(t=>t.getAttribute('aria-controls')==='panel-'+link.dataset.openTab);if(target){activateTab(target,true);target.scrollIntoView({block:'start',behavior:reduced?'auto':'smooth'})}}));

// Busca e categorias dos produtos.
const search=$('#product-search'),categoryButtons=$$('[data-category-choice]');let category='all';
function filterProducts(){
 const q=normalize(search?.value||'');let count=0;
 $$('[data-product-card]').forEach(card=>{const visible=(!q||normalize(card.dataset.name).includes(q))&&(category==='all'||card.dataset.category===category);card.hidden=!visible;if(visible)count++});
 const countEl=$('#product-count');if(countEl)countEl.textContent=count+' produtos encontrados';const empty=$('#product-empty');if(empty)empty.hidden=count!==0;
}
search?.addEventListener('input',filterProducts);
categoryButtons.forEach(b=>b.addEventListener('click',()=>{category=b.dataset.categoryChoice;categoryButtons.forEach(x=>x.setAttribute('aria-pressed',String(x===b)));filterProducts()}));
$('#clear-product-search')?.addEventListener('click',()=>{if(search)search.value='';category='all';categoryButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.categoryChoice==='all')));filterProducts();search?.focus()});

// Histórico: combina filtros sem preencher valores ausentes.
const month=$('#month'),market=$('#market'),rowSearch=$('#row-search');
function filterTable(){
 let count=0;const m=month?.value||'all',k=market?.value||'all',q=normalize(rowSearch?.value||'');
 $$('[data-row]').forEach(r=>{const visible=(m==='all'||r.dataset.month===m)&&(k==='all'||r.dataset.market===k)&&(!q||normalize(r.textContent).includes(q));r.hidden=!visible;if(visible)count++});
 const countEl=$('#row-count');if(countEl)countEl.textContent=count+' registros exibidos';const empty=$('#row-empty');if(empty)empty.hidden=count!==0;
 $$('[data-series-market]').forEach(g=>g.style.opacity=k==='all'||g.dataset.seriesMarket===k?'1':'.12');
}
for(const field of [month,market,rowSearch]){field?.addEventListener('input',filterTable);field?.addEventListener('change',filterTable)}
$('#reset')?.addEventListener('click',()=>{if(month)month.value='all';if(market)market.value='all';if(rowSearch)rowSearch.value='';filterTable()});
filterTable();
$$('[data-series-toggle]').forEach(b=>b.addEventListener('click',()=>{
 const active=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',String(active));
 $$('[data-series-market]').filter(g=>g.dataset.seriesMarket===b.dataset.seriesToggle).forEach(g=>g.style.opacity=active?'1':'.12');
}));

// Ferramenta educativa: campos positivos e mesma unidade de medida.
$$('[data-calculator]').forEach(form=>{
 const price=$('[name="price"]',form),weight=$('[name="weight"]',form),target=$('[name="target"]',form),out=$('output',form),message=$('[data-calc-message]',form);
 function calc(){const p=price.valueAsNumber,w=weight.valueAsNumber,t=target.valueAsNumber,valid=Number.isFinite(p)&&Number.isFinite(w)&&Number.isFinite(t)&&p>=0&&w>0&&t>0;out.textContent=valid?brl.format(p*t/w):'—';message.textContent=valid?'Simulação educativa. Não modifica os registros da pesquisa.':'Informe preço e quantidades válidos; quantidades devem ser maiores que zero.'}
 [price,weight,target].forEach(x=>x.addEventListener('input',calc));form.addEventListener('submit',e=>e.preventDefault());calc();
});

// Busca global por produtos, em qualquer página, com foco contido no diálogo.
const backdrop=$('#search-backdrop'),dialog=$('#search-dialog'),globalSearch=$('#global-search');let previousFocus;
function filterGlobal(){const q=normalize(globalSearch.value);let count=0;$$('[data-global-result]',dialog).forEach(r=>{const show=normalize(r.dataset.name).includes(q)&&count<12;r.hidden=!show;if(show)count++});$('#global-empty').hidden=count!==0;$('#global-count').textContent=count+' resultados'}
function openSearch(){previousFocus=document.activeElement;backdrop.hidden=false;document.body.style.overflow='hidden';globalSearch.value='';filterGlobal();globalSearch.focus()}
function closeSearch(){backdrop.hidden=true;document.body.style.overflow='';previousFocus?.focus()}
$$('[data-open-search]').forEach(b=>b.addEventListener('click',openSearch));$('#close-search')?.addEventListener('click',closeSearch);globalSearch?.addEventListener('input',filterGlobal);
backdrop?.addEventListener('click',e=>{if(e.target===backdrop)closeSearch()});
document.addEventListener('keydown',e=>{
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openSearch()}
 if(!backdrop||backdrop.hidden)return;if(e.key==='Escape'){e.preventDefault();closeSearch()}
 if(e.key==='Tab'){const list=$$('button,input,a',dialog).filter(x=>!x.closest('[hidden]'));const first=list[0],last=list[list.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}
});

// Tooltips dos gráficos funcionam com mouse, teclado e toque.
let tooltip;
function showTip(el){const title=$('title',el);if(!title)return;if(!tooltip){tooltip=document.createElement('div');tooltip.className='chart-tooltip';tooltip.setAttribute('role','status');document.body.appendChild(tooltip)}tooltip.textContent=title.textContent;tooltip.hidden=false;const rect=el.getBoundingClientRect();tooltip.style.left=Math.max(10,Math.min(innerWidth-250,rect.x-65))+'px';tooltip.style.top=Math.max(10,rect.y-63)+'px'}
$$('.chart circle').forEach(c=>{const title=$('title',c);if(!title)return;c.setAttribute('tabindex','0');c.setAttribute('aria-label',title.textContent);c.addEventListener('mouseenter',()=>showTip(c));c.addEventListener('focus',()=>showTip(c));c.addEventListener('click',()=>showTip(c));c.addEventListener('mouseleave',()=>{if(tooltip)tooltip.hidden=true});c.addEventListener('blur',()=>{if(tooltip)tooltip.hidden=true})});

if(!reduced&&matchMedia('(pointer:fine)').matches){const hero=$('.hero-visual'),scene=$('.basket-scene');hero?.addEventListener('pointermove',e=>{const r=hero.getBoundingClientRect();scene.style.setProperty('--px',((e.clientX-r.left)/r.width-.5)*10+'px');scene.style.setProperty('--py',((e.clientY-r.top)/r.height-.5)*8+'px')});hero?.addEventListener('pointerleave',()=>{scene.style.setProperty('--px','0px');scene.style.setProperty('--py','0px')})}
$$('[data-print]').forEach(b=>b.addEventListener('click',()=>window.print()));$('#back-top')?.addEventListener('click',()=>window.scrollTo({top:0,behavior:reduced?'auto':'smooth'}));
})();
