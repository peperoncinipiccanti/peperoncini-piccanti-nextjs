<?php
/**
 * Render del blocco "Blocco Recensione (dettaglio)" — stessa idea di
 * ReviewBreakdown.tsx nel frontend Next.js: l'anello grande (.pp-review-ring,
 * definito in assets/css/style.css) col punteggio finale, titolo e
 * sommario della recensione (campo WYSIWYG ACF, va stampato come HTML
 * con wp_kses_post — non e' testo semplice), poi una barra per ciascun
 * "Review Criteria" inserito dall'editor. Renderizzato solo per gli
 * articoli con un blocco Recensione valorizzato (vedi pp_get_review() in
 * functions.php) — mai per le ricette.
 *
 * @var array    $attributes
 * @var string   $content
 * @var WP_Block $block
 */
$post_id = isset( $block->context['postId'] ) ? (int) $block->context['postId'] : get_the_ID();
if ( ! $post_id ) {
	return;
}

$review = pp_get_review( $post_id );
if ( ! $review || null === $review['score'] ) {
	return;
}

$score   = max( 0, min( 10, (float) $review['score'] ) );
$percent = round( ( $score / 10 ) * 100 );
$label   = fmod( $score, 1 ) === 0.0 ? (string) (int) $score : number_format( $score, 1 );

$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => 'pp-review' ) );
?>
<div <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
	<h2 class="pp-review__heading">
		<span class="pp-review__heading-label">Recensione</span>
		<span class="pp-review__heading-sep" aria-hidden="true">|</span>
		<span class="pp-review__heading-title"><?php echo esc_html( get_the_title( $post_id ) ); ?></span>
	</h2>

	<div class="pp-review__box">
		<div class="pp-review__summary">
			<div class="pp-review-ring" style="--pp-rating-percent:<?php echo (int) $percent; ?>;" role="img" aria-label="Punteggio recensione: <?php echo esc_attr( $label ); ?> su 10">
				<span class="pp-review-ring__value"><?php echo esc_html( $label ); ?></span>
			</div>

			<?php if ( ! empty( $review['title'] ) ) : ?>
				<p class="pp-review__title"><?php echo esc_html( $review['title'] ); ?></p>
			<?php endif; ?>

			<?php if ( ! empty( $review['summary'] ) ) : ?>
				<div class="pp-review__summary-text"><?php echo wp_kses_post( $review['summary'] ); ?></div>
			<?php endif; ?>
		</div>

		<?php if ( ! empty( $review['criteria'] ) ) : ?>
			<div class="pp-review__criteria">
				<?php foreach ( $review['criteria'] as $criterion ) : ?>
					<?php
					$value       = null !== $criterion['rating'] ? (float) $criterion['rating'] : 0;
					$bar_percent = max( 0, min( 100, ( $value / 10 ) * 100 ) );
					?>
					<div class="pp-review__criterion">
						<div class="pp-review__criterion-head">
							<span class="pp-review__criterion-label"><?php echo esc_html( $criterion['label'] ); ?></span>
							<span class="pp-review__criterion-value"><?php echo null !== $criterion['rating'] ? esc_html( $criterion['rating'] ) : '–'; ?></span>
						</div>
						<div class="pp-review__criterion-track">
							<div class="pp-review__criterion-fill" style="width:<?php echo esc_attr( $bar_percent ); ?>%"></div>
						</div>
					</div>
				<?php endforeach; ?>
			</div>
		<?php endif; ?>
	</div>
</div>
