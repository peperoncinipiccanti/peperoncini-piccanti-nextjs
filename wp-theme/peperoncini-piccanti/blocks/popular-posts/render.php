<?php
/**
 * Render del blocco "Post più visti" — stessa idea di
 * PopularPostsWidget.tsx nel frontend Next.js: tre liste gia'
 * renderizzate lato server (Settimana/Mese/Sempre, da pp_get_popular_posts()
 * in functions.php), il JS del blocco si limita a mostrare quella
 * corrispondente al tab cliccato — nessuna richiesta aggiuntiva.
 *
 * @var array $attributes
 */
$limit = isset( $attributes['limit'] ) ? (int) $attributes['limit'] : 5;
$data  = pp_get_popular_posts( $limit );

if ( empty( $data['weekly'] ) && empty( $data['monthly'] ) && empty( $data['all_time'] ) ) {
	return;
}

wp_enqueue_script( 'pp-popular-posts' );
wp_enqueue_style( 'peperoncini-piccanti-style' );

$tabs = array(
	'weekly'   => 'Settimana',
	'monthly'  => 'Mese',
	'all_time' => 'Sempre',
);

$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => 'pp-popular' ) );
?>
<aside <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> aria-label="I post piccanti più visti">
	<h2 class="pp-popular__heading">I post piccanti più visti</h2>

	<div class="pp-popular__tabs" role="tablist">
		<?php foreach ( $tabs as $key => $label ) : ?>
			<button
				type="button"
				class="pp-popular__tab<?php echo 'weekly' === $key ? ' is-active' : ''; ?>"
				data-pp-popular-tab="<?php echo esc_attr( $key ); ?>"
				role="tab"
				aria-selected="<?php echo 'weekly' === $key ? 'true' : 'false'; ?>"
			><?php echo esc_html( $label ); ?></button>
		<?php endforeach; ?>
	</div>

	<?php foreach ( $tabs as $key => $label ) : ?>
		<?php $items = $data[ $key ]; ?>
		<ol
			class="pp-popular__list"
			data-pp-popular-panel="<?php echo esc_attr( $key ); ?>"
			<?php echo 'weekly' !== $key ? 'hidden' : ''; ?>
		>
			<?php if ( empty( $items ) ) : ?>
				<li class="pp-popular__empty">Nessun dato disponibile per questo periodo.</li>
			<?php endif; ?>
			<?php foreach ( $items as $i => $item ) : ?>
				<?php
				$post_id   = $item['id'];
				$image_id  = get_post_thumbnail_id( $post_id );
				$image_url = $image_id ? pp_best_thumbnail_url( $image_id, 'thumbnail' ) : null;
				$permalink = get_permalink( $post_id );
				?>
				<li class="pp-popular__item">
					<span class="pp-popular__rank"><?php echo (int) ( $i + 1 ); ?></span>
					<a href="<?php echo esc_url( $permalink ); ?>" class="pp-popular__thumb">
						<?php if ( $image_url ) : ?>
							<img src="<?php echo esc_url( $image_url ); ?>" alt="" loading="lazy" decoding="async" />
						<?php endif; ?>
					</a>
					<span class="pp-popular__info">
						<a href="<?php echo esc_url( $permalink ); ?>" class="pp-popular__title"><?php echo esc_html( get_the_title( $post_id ) ); ?></a>
						<span class="pp-popular__views"><?php echo (int) $item['views']; ?> visualizzazioni</span>
					</span>
				</li>
			<?php endforeach; ?>
		</ol>
	<?php endforeach; ?>
</aside>
