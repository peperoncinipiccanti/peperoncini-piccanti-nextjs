<?php
/**
 * Title: CTA Coltivare il peperoncino
 * Slug: peperoncini-piccanti/cta-coltivare
 * Categories: peperoncini-piccanti
 * Description: Banner a piena larghezza con immagine di sfondo, richiamo alla guida di coltivazione. Sostituisce lo shortcode/plugin usato nel vecchio tema con un semplice blocco Copertina nativo.
 */
?>
<!-- wp:cover {"overlayColor":"notte","dimRatio":60,"minHeight":360,"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|40","bottom":"var:preset|spacing|40"}}}} -->
<div class="wp-block-cover alignfull" style="padding-top:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40);min-height:360px">
	<span aria-hidden="true" class="wp-block-cover__background has-notte-background-color has-background-dim-60 has-background-dim"></span>
	<div class="wp-block-cover__inner-container">

		<!-- wp:heading {"textAlign":"center","level":2,"textColor":"base","style":{"typography":{"fontSize":"1.9rem"}}} -->
		<h2 class="wp-block-heading has-text-align-center has-base-color has-text-color" style="font-size:1.9rem">Vuoi imparare a coltivare il peperoncino in casa?</h2>
		<!-- /wp:heading -->

		<!-- wp:paragraph {"align":"center","textColor":"base"} -->
		<p class="has-text-align-center has-base-color has-text-color">Segui i miei consigli. Pochi, facili ed efficaci.</p>
		<!-- /wp:paragraph -->

		<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
		<div class="wp-block-buttons">
			<!-- wp:button {"backgroundColor":"teal","textColor":"base","style":{"border":{"width":"0px"}}} -->
			<div class="wp-block-button">
				<a class="wp-block-button__link has-base-color has-teal-background-color has-text-color has-background wp-element-button" href="/come-coltivare-peperoncino/" style="border-width:0px">Scopri qui come fare</a>
			</div>
			<!-- /wp:button -->
		</div>
		<!-- /wp:buttons -->

	</div>
</div>
<!-- /wp:cover -->
