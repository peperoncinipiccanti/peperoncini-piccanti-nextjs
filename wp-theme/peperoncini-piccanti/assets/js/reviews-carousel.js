/**
 * Carosello Recensioni: le pagine sono gia' tutte renderizzate lato
 * server (vedi blocks/reviews-carousel/render.php), qui si mostra/nasconde
 * solo quella giusta — nessuna richiesta di rete a ogni click sulle
 * frecce, stessa idea di ReviewsCarousel.tsx nel frontend Next.js.
 */
( function () {
	document.querySelectorAll( '.pp-reviews' ).forEach( function ( root ) {
		var pages = root.querySelectorAll( '[data-pp-reviews-page]' );
		if ( pages.length <= 1 ) {
			return;
		}

		var current = 0;

		function show( index ) {
			current = ( index + pages.length ) % pages.length;
			pages.forEach( function ( page, i ) {
				if ( i === current ) {
					page.removeAttribute( 'hidden' );
				} else {
					page.setAttribute( 'hidden', '' );
				}
			} );
		}

		var prevBtn = root.querySelector( '[data-pp-reviews-prev]' );
		var nextBtn = root.querySelector( '[data-pp-reviews-next]' );
		if ( prevBtn ) {
			prevBtn.addEventListener( 'click', function () {
				show( current - 1 );
			} );
		}
		if ( nextBtn ) {
			nextBtn.addEventListener( 'click', function () {
				show( current + 1 );
			} );
		}
	} );
} )();
