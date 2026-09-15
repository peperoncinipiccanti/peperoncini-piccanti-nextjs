<?php
/**
 * Render del blocco "Pulsanti di condivisione" — stessa idea di
 * ShareButtons.tsx nel frontend Next.js: riga di icone rotonde in fondo
 * all'articolo (Facebook, X/Twitter, WhatsApp, Pinterest, copia link).
 * L'URL condiviso e' sempre `window.location.href` (letto al momento del
 * click da assets/js/share-buttons.js), non un campo salvato nel
 * database, cosi' resta corretto qualunque dominio serva la pagina in
 * quel momento.
 *
 * @var array    $attributes
 * @var string   $content
 * @var WP_Block $block
 */
$post_id = isset( $block->context['postId'] ) ? (int) $block->context['postId'] : get_the_ID();
if ( ! $post_id ) {
	return;
}

wp_enqueue_script( 'pp-share-buttons' );
wp_enqueue_style( 'peperoncini-piccanti-style' );

$platforms = array(
	'facebook' => 'Facebook',
	'x'        => 'X (Twitter)',
	'whatsapp' => 'WhatsApp',
	'pinterest' => 'Pinterest',
);

$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => 'pp-share' ) );
?>
<div <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> data-pp-share data-post-id="<?php echo (int) $post_id; ?>">
	<p class="pp-share__label">Condividi questo articolo</p>
	<div class="pp-share__buttons">
		<?php foreach ( $platforms as $key => $label ) : ?>
			<button type="button" class="pp-share__button" data-pp-share-platform="<?php echo esc_attr( $key ); ?>" aria-label="Condividi su <?php echo esc_attr( $label ); ?>">
				<?php echo esc_html( strtoupper( substr( $key, 0, 1 ) ) ); ?>
			</button>
		<?php endforeach; ?>
		<button type="button" class="pp-share__button" data-pp-share-copy aria-label="Copia link articolo">🔗</button>
	</div>
</div>
