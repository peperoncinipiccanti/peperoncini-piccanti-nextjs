/**
 * Badge Share/Love in cima all'articolo (blocco Reazioni articolo).
 *
 * - "Love": incrementa/mostra il conteggio con un POST a pphc/v1/react
 *   (stesso endpoint del plugin companion headless, servito dal tema se
 *   il plugin non e' attivo — vedi pp_register_reaction_route() in
 *   functions.php). Un click per browser: il localStorage ricorda se
 *   QUESTO browser ha gia' messo Love su QUESTO articolo, cosi' il tasto
 *   si disattiva dopo il primo click — nessuna protezione anti-frode
 *   lato server, stessa scelta gia' fatta nel sito headless.
 * - "Share": incrementa il contatore e apre un piccolo menu con i
 *   canali di condivisione, stessa lista di assets/js/share-buttons.js.
 */
( function () {
	if ( typeof ppReactions === 'undefined' ) {
		return;
	}

	function postReaction( postId, type, onDone ) {
		fetch( ppReactions.restUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-WP-Nonce': ppReactions.nonce,
			},
			body: JSON.stringify( { postId: postId, type: type } ),
		} )
			.then( function ( res ) {
				return res.json();
			} )
			.then( function ( data ) {
				if ( onDone && data && typeof data.count === 'number' ) {
					onDone( data.count );
				}
			} )
			.catch( function () {
				/* rete non disponibile: il contatore locale resta quello gia' mostrato lato server. */
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

	function openSharePopover( anchorEl, postId, title ) {
		var existing = document.querySelector( '.pp-reactions__popover' );
		if ( existing ) {
			existing.remove();
		}

		var links = buildShareLinks( window.location.href, title );
		var popover = document.createElement( 'div' );
		popover.className = 'pp-reactions__popover';
		popover.innerHTML =
			'<a href="' + links.facebook + '" target="_blank" rel="noopener noreferrer">Facebook</a>' +
			'<a href="' + links.x + '" target="_blank" rel="noopener noreferrer">X (Twitter)</a>' +
			'<a href="' + links.whatsapp + '" target="_blank" rel="noopener noreferrer">WhatsApp</a>' +
			'<a href="' + links.pinterest + '" target="_blank" rel="noopener noreferrer">Pinterest</a>' +
			'<button type="button" data-pp-copy>Copia link</button>';

		anchorEl.style.position = 'relative';
		anchorEl.appendChild( popover );

		popover.querySelector( '[data-pp-copy]' ).addEventListener( 'click', function () {
			navigator.clipboard && navigator.clipboard.writeText( window.location.href );
			popover.remove();
		} );

		setTimeout( function () {
			document.addEventListener(
				'click',
				function onDocClick( e ) {
					if ( ! popover.contains( e.target ) ) {
						popover.remove();
						document.removeEventListener( 'click', onDocClick );
					}
				}
			);
		}, 0 );
	}

	document.querySelectorAll( '[data-pp-reactions]' ).forEach( function ( root ) {
		var postId = root.getAttribute( 'data-post-id' );
		var loveKey = 'pp-loved-' + postId;
		var loveBtn = root.querySelector( '[data-pp-reaction="love"]' );
		var shareBtn = root.querySelector( '[data-pp-reaction="share"]' );

		if ( loveBtn && window.localStorage && window.localStorage.getItem( loveKey ) ) {
			loveBtn.classList.add( 'is-active' );
			loveBtn.disabled = true;
		}

		if ( loveBtn ) {
			loveBtn.addEventListener( 'click', function () {
				if ( window.localStorage && window.localStorage.getItem( loveKey ) ) {
					return;
				}
				postReaction( postId, 'love', function ( count ) {
					var countEl = root.querySelector( '[data-pp-reaction-count="love"]' );
					if ( countEl ) {
						countEl.textContent = count;
					}
					loveBtn.classList.add( 'is-active' );
					loveBtn.disabled = true;
					window.localStorage && window.localStorage.setItem( loveKey, '1' );
				} );
			} );
		}

		if ( shareBtn ) {
			shareBtn.addEventListener( 'click', function () {
				postReaction( postId, 'share', function ( count ) {
					var countEl = root.querySelector( '[data-pp-reaction-count="share"]' );
					if ( countEl ) {
						countEl.textContent = count;
					}
				} );
				openSharePopover( shareBtn, postId, document.title );
			} );
		}
	} );
} )();
