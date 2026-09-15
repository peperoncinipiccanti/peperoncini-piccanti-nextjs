<?php
/**
 * Title: Griglia articoli con sidebar
 * Slug: peperoncini-piccanti/griglia-con-sidebar
 * Categories: peperoncini-piccanti
 * Block Types: core/query
 * Description: Layout 2/3 + 1/3 delle pagine categoria/tag/ricerca del sito attuale: griglia a 2 colonne che eredita la query principale della pagina, sidebar con Post più visti, Ultimi commenti e Tag più utilizzati. Sostituisce "Griglia articoli" nelle pagine archivio/ricerca.
 */
?>
<!-- wp:group {"align":"wide","className":"pp-layout-sidebar","layout":{"type":"default"}} -->
<div class="wp-block-group alignwide pp-layout-sidebar">

	<!-- wp:group {"layout":{"type":"constrained"}} -->
	<div class="wp-block-group">

		<!-- wp:query {"queryId":11,"query":{"inherit":true},"className":"pp-archive-grid"} -->
		<div class="wp-block-query pp-archive-grid">
			<!-- wp:post-template {"layout":{"type":"default"}} -->
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

			<!-- wp:query-pagination {"style":{"spacing":{"margin":{"top":"var:preset|spacing|30"}}},"layout":{"type":"flex","justifyContent":"center"}} -->
				<!-- wp:query-pagination-previous {"label":"« Precedenti"} /-->
				<!-- wp:query-pagination-numbers /-->
				<!-- wp:query-pagination-next {"label":"Successivi »"} /-->
			<!-- /wp:query-pagination -->

		</div>
		<!-- /wp:query -->

	</div>
	<!-- /wp:group -->

	<!-- wp:group {"className":"pp-layout-sidebar__sidebar","layout":{"type":"default"}} -->
	<div class="wp-block-group pp-layout-sidebar__sidebar">

		<!-- wp:peperoncini-piccanti/popular-posts /-->

		<!-- wp:group {"className":"pp-comments-widget","layout":{"type":"default"}} -->
		<div class="wp-block-group pp-comments-widget">
			<!-- wp:heading {"level":2,"style":{"typography":{"fontSize":"1.5rem"}}} -->
			<h2 class="wp-block-heading" style="font-size:1.5rem">Ultimi commenti</h2>
			<!-- /wp:heading -->
			<!-- wp:latest-comments {"commentsToShow":7,"displayAvatar":false,"displayDate":true,"displayExcerpt":true} /-->
		</div>
		<!-- /wp:group -->

		<!-- wp:peperoncini-piccanti/popular-tags /-->

	</div>
	<!-- /wp:group -->

</div>
<!-- /wp:group -->
