<?php
/**
 * Render del blocco "Tag più utilizzati" — stessa idea di
 * PopularTagsWidget.tsx nel frontend Next.js.
 *
 * @var array $attributes
 */
$limit = isset( $attributes['limit'] ) ? (int) $attributes['limit'] : 12;
$tags  = pp_get_popular_tags( $limit );

if ( empty( $tags ) ) {
	return;
}

$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => 'pp-popular-tags' ) );
?>
<aside <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> aria-label="Tag più utilizzati">
	<h2 class="pp-popular-tags__heading">Tag più utilizzati</h2>
	<ul class="pp-popular-tags__list">
		<?php foreach ( $tags as $tag ) : ?>
			<li><a class="pp-tag" href="<?php echo esc_url( get_term_link( $tag ) ); ?>"><?php echo esc_html( $tag->name ); ?></a></li>
		<?php endforeach; ?>
	</ul>
</aside>
