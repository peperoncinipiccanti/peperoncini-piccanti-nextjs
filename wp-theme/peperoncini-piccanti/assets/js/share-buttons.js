/**
 * Pulsanti di condivisione in fondo all'articolo — vedi anche
 * assets/js/reactions.js (badge in cima) per la stessa build dei link:
 * duplicato volutamente qui invece di condividere un modulo JS, per
 * restare senza bundler/step di build (ogni file e' indipendente e
 * caricato solo quando il suo blocco compare in pagina).
 */
( function () {
	if ( typeof ppReactions === 'undefined' ) {
		return;
	}

	function postReaction( postId, type ) {
		fetch( ppReactions.restUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-WP-Nonce': ppReactions.nonce,
			},
			body: JSON.stringify( { postId: postId, type: type } ),
		} ).catch( function () {
			/* rete non disponibile: nessun blocco per il visitatore. */
		} );
	}

	function buildShareLinks( url, title ) {
		var encodedUrl = encodeURIComponent( url );
		var encodedTitle = encodeURIComponent( title );
		return {
			facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + encodedUrl,
			x: 'https://twitter.com/intent/tweet?url=' + encodedUrl + '&text=' + encodedTitle,
			whatsapp: 'https://wa.me/?text=' + encodedTitle + '%20' + encodedUrl,
			pinterest: 'https://pinterest.com/pin/create/button/?url=' + encodedUrl + '&description=' + encodedTitle,
		};
	}

	document.querySelectorAll( '[data-pp-share]' ).forEach( function ( root ) {
		var postId = root.getAttribute( 'data-post-id' );
		var links = buildShareLinks( window.location.href, document.title );

		root.querySelectorAll( '[data-pp-share-platform]' ).forEach( function ( btn ) {
			var platform = btn.getAttribute( 'data-pp-share-platform' );
			btn.addEventListener( 'click', function () {
				postReaction( postId, 'share' );
				window.open( links[ platform ], '_blank', 'noopener,noreferrer,width=600,height=500' );
			} );
		} );

		var copyBtn = root.querySelector( '[data-pp-share-copy]' );
		if ( copyBtn ) {
			copyBtn.addEventListener( 'click', function () {
				postReaction( postId, 'share' );
				if ( navigator.clipboard ) {
					navigator.clipboard.writeText( window.location.href );
				}
				var original = copyBtn.textContent;
				copyBtn.textContent = '✓';
				setTimeout( function () {
					copyBtn.textContent = original;
				}, 2000 );
			} );
		}
	} );
} )();
