/**
 * Carosello Hero: autoplay ogni 3.5s (si ferma al passaggio del mouse),
 * frecce prev/next, scorrimento nativo CSS scroll-snap sotto — stessa
 * logica di HeroCarousel.tsx nel frontend Next.js. Vanilla JS, nessuna
 * dipendenza.
 */
( function () {
	var AUTOPLAY_MS = 3500;

	document.querySelectorAll( '[data-pp-hero]' ).forEach( function ( root ) {
		var scroller = root.querySelector( '[data-pp-hero-scroller]' );
		if ( ! scroller ) {
			return;
		}

		var paused = false;
		var slideCount = scroller.children.length;

		function scrollByOne( direction ) {
			var width = scroller.clientWidth;
			scroller.scrollBy( { left: direction * width, behavior: 'smooth' } );
		}

		var prevBtn = root.querySelector( '[data-pp-hero-prev]' );
		var nextBtn = root.querySelector( '[data-pp-hero-next]' );
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

		root.addEventListener( 'mouseenter', function () {
			paused = true;
		} );
		root.addEventListener( 'mouseleave', function () {
			paused = false;
		} );

		if ( slideCount > 1 ) {
			setInterval( function () {
				if ( paused ) {
					return;
				}
				var atEnd = scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 4;
				if ( atEnd ) {
					scroller.scrollTo( { left: 0, behavior: 'smooth' } );
				} else {
					scroller.scrollBy( { left: scroller.clientWidth, behavior: 'smooth' } );
				}
			}, AUTOPLAY_MS );
		}
	} );
} )();
