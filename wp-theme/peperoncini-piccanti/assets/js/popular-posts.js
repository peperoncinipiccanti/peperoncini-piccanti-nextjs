/**
 * Widget "Post più visti": cambia tab (Settimana/Mese/Sempre) mostrando
 * il pannello corrispondente, gia' presente nell'HTML — nessuna
 * richiesta di rete, stessa idea di PopularPostsWidget.tsx nel frontend
 * Next.js.
 */
( function () {
	document.querySelectorAll( '.pp-popular' ).forEach( function ( root ) {
		var tabs = root.querySelectorAll( '[data-pp-popular-tab]' );
		var panels = root.querySelectorAll( '[data-pp-popular-panel]' );

		tabs.forEach( function ( tab ) {
			tab.addEventListener( 'click', function () {
				var key = tab.getAttribute( 'data-pp-popular-tab' );

				tabs.forEach( function ( t ) {
					var active = t === tab;
					t.classList.toggle( 'is-active', active );
					t.setAttribute( 'aria-selected', active ? 'true' : 'false' );
				} );

				panels.forEach( function ( panel ) {
					if ( panel.getAttribute( 'data-pp-popular-panel' ) === key ) {
						panel.removeAttribute( 'hidden' );
					} else {
						panel.setAttribute( 'hidden', '' );
					}
				} );
			} );
		} );
	} );
} )();
