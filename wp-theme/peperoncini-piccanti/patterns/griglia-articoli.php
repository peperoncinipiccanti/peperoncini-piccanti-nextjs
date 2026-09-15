<?php
/**
 * Title: Griglia articoli (query principale)
 * Slug: peperoncini-piccanti/griglia-articoli
 * Categories: peperoncini-piccanti
 * Block Types: core/query
 * Description: Griglia di card stile "magazine" che eredita la query principale della pagina (archivio, ricerca, blog). Riusata in index.html, archive.html e search.html.
 */
?>
<!-- wp:query {"queryId":10,"query":{"inherit":true},"align":"wide"} -->
<div class="wp-block-query alignwide">

	<!-- wp:post-template {"layout":{"type":"grid","columnCount":3}} -->
		<!-- wp:group {"className":"pp-post-card","layout":{"type":"default"}} -->
		<div class="wp-block-group pp-post-card">
			<!-- wp:post-featured-image {"isLink":true,"sizeSlug":"pp-card"} /-->

			<!-- wp:peperoncini-piccanti/rating-badge /-->

			<!-- wp:group {"className":"pp-post-card__overlay","layout":{"type":"default"}} -->
			<div class="wp-block-group pp-post-card__overlay"></div>
			<!-- /wp:group -->

			<!-- wp:group {"className":"pp-post-card__content","layout":{"type":"default"}} -->
			<div class="wp-block-group pp-post-card__content">
				<!-- wp:post-terms {"term":"category","className":"pp-term-pills"} /-->
				<!-- wp:post-title {"isLink":true,"level":3} /-->
				<!-- wp:read-more {"content":"Leggi »"} /-->
			</div>
			<!-- /wp:group -->
		</div>
		<!-- /wp:group -->
	<!-- /wp:post-template -->

	<!-- wp:query-no-results -->
		<!-- wp:paragraph -->
		<p>Nessun articolo trovato. Prova a modificare la ricerca.</p>
		<!-- /wp:paragraph -->
	<!-- /wp:query-no-results -->

	<!-- wp:query-pagination {"layout":{"type":"flex","justifyContent":"center"}} -->
		<!-- wp:query-pagination-previous {"label":"« Precedenti"} /-->
		<!-- wp:query-pagination-numbers /-->
		<!-- wp:query-pagination-next {"label":"Successivi »"} /-->
	<!-- /wp:query-pagination -->

</div>
<!-- /wp:query -->
