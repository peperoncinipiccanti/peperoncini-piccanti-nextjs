<?php
/**
 * Render del blocco "Carosello Hero": stessa idea di HeroCarousel.tsx nel
 * frontend Next.js — articoli "Featured" (vedi pp_get_featured_posts() in
 * functions.php), scorrimento automatico che si ferma al passaggio del
 * mouse, frecce prev/next, striscia con TUTTI i titoli in evidenza sotto
 * (comportamento del vecchio tema Edition: la lista non cambia scorrendo
 * le slide). Markup semplice in scroll-snap: funziona anche senza il JS
 * di questo blocco, che aggiunge solo le frecce e l'autoplay.
 *
 * @var array $attributes
 */
$limit = isset( $attributes['limit'] ) ? (int) $attributes['limit'] : 4;
$ids   = pp_get_featured_posts( $limit );

if ( empty( $ids ) ) {
	return;
}

wp_enqueue_script( 'pp-hero-carousel' );
wp_enqueue_style( 'peperoncini-piccanti-style' );

$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => 'pp-hero alignfull' ) );
?>
<section <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> aria-label="Articoli in evidenza" data-pp-hero>
	<div class="pp-hero-scroller" data-pp-hero-scroller>
		<?php foreach ( $ids as $i => $post_id ) : ?>
			<?php
			$permalink = get_permalink( $post_id );
			$title     = get_the_title( $post_id );
			$image_id  = get_post_thumbnail_id( $post_id );
			$image_url = $image_id ? pp_best_thumbnail_url( $image_id, 'pp-hero' ) : null;
			$rating    = pp_get_rating( $post_id );
			$cats      = get_the_category( $post_id );
			$cta_label = pp_is_recipe( $post_id ) ? 'Guarda la ricetta' : 'Leggi';
			?>
			<article class="pp-hero__slide">
				<a href="<?php echo esc_url( $permalink ); ?>" class="pp-hero__link" aria-label="<?php echo esc_attr( $title ); ?>"></a>

				<?php if ( $image_url ) : ?>
					<img
						src="<?php echo esc_url( $image_url ); ?>"
						alt="<?php echo esc_attr( get_post_meta( $image_id, '_wp_attachment_image_alt', true ) ); ?>"
						class="pp-hero__image"
						loading="<?php echo 0 === $i ? 'eager' : 'lazy'; ?>"
						<?php echo 0 === $i ? 'fetchpriority="high"' : ''; ?>
						decoding="async"
					/>
				<?php endif; ?>

				<?php if ( null !== $rating ) : ?>
					<?php $percent = round( ( $rating / 10 ) * 100 ); ?>
					<div class="pp-rating-badge pp-hero__rating" style="--pp-rating-percent:<?php echo (int) $percent; ?>;" aria-hidden="true">
						<span class="pp-rating-badge__ring">
							<span class="pp-rating-badge__value"><?php echo esc_html( rtrim( rtrim( number_format( $rating, 1 ), '0' ), '.' ) ); ?></span>
						</span>
					</div>
				<?php endif; ?>

				<div class="pp-hero__content">
					<?php if ( ! empty( $cats ) ) : ?>
						<ul class="pp-hero__pills">
							<?php foreach ( array_slice( $cats, 0, 2 ) as $cat ) : ?>
								<li class="pp-tag"><?php echo esc_html( $cat->name ); ?></li>
							<?php endforeach; ?>
						</ul>
					<?php endif; ?>
					<h2 class="pp-hero__title"><?php echo esc_html( $title ); ?></h2>
					<span class="pp-hero__cta" aria-hidden="true"><?php echo esc_html( $cta_label ); ?></span>
				</div>
			</article>
		<?php endforeach; ?>
	</div>

	<?php if ( count( $ids ) > 1 ) : ?>
		<div class="pp-hero__arrows">
			<button type="button" class="pp-hero__arrow pp-hero__arrow--prev" data-pp-hero-prev aria-label="Articolo precedente">‹</button>
			<button type="button" class="pp-hero__arrow pp-hero__arrow--next" data-pp-hero-next aria-label="Articolo successivo">›</button>
		</div>

		<ul class="pp-hero__strip">
			<?php foreach ( $ids as $post_id ) : ?>
				<li>
					<a href="<?php echo esc_url( get_permalink( $post_id ) ); ?>">
						<span class="pp-hero__strip-title"><?php echo esc_html( get_the_title( $post_id ) ); ?></span>
						<span class="pp-hero__strip-date"><?php echo esc_html( human_time_diff( get_post_timestamp( $post_id ) ) . ' fa' ); ?></span>
					</a>
				</li>
			<?php endforeach; ?>
		</ul>
	<?php endif; ?>
</section>
