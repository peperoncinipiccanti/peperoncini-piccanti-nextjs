/**
 * Carosello per tag ("Peperoncino e Salute", "Come conservare i
 * peperoncini"): scorrimento orizzontale con frecce, torna all'inizio
 * dopo l'ultima card e viceversa — stessa idea di HealthCarousel.tsx /
 * PreserveCarousel.tsx nel frontend Next.js. Nessun autoplay (a
 * differenza dell'hero): qui lo scorrimento e' solo manuale/tramite
 * frecce, come nei componenti originali.
 */
( function () {
	document.querySelectorAll( '.pp-tagcarousel' ).forEach( function ( root ) {
		var scroller = root.querySelector( '[data-pp-tagcarousel-scroller]' );
		if ( ! scroller ) {
			return;
		}

		function scrollByOne( direction ) {
			var item = scroller.firstElementChild;
			var step = item ? item.clientWidth : scroller.clientWidth;

			if ( direction === 1 && scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 4 ) {
				scroller.scrollTo( { left: 0, behavior: 'smooth' } );
				return;
			}
			if ( direction === -1 && scroller.scrollLeft <= 4 ) {
				scroller.scrollTo( { left: scroller.scrollWidth, behavior: 'smooth' } );
				return;
			}
			scroller.scrollBy( { left: direction * step, behavior: 'smooth' } );
		}

		var prevBtn = root.querySelector( '[data-pp-tagcarousel-prev]' );
		var nextBtn = root.querySelector( '[data-pp-tagcarousel-next]' );
		if ( prevBtn ) {
			prevBtn.addEventListener( 'click', function () {
				scrollByOne( -1 );
			} );
		}
		if ( nextBtn ) {
			nextBtn.addEventListener( 'click', function () {
				scrollByOne( 1 );
			} );
		}
	} );
} )();
