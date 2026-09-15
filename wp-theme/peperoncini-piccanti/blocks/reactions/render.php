<?php
/**
 * Render del blocco "Reazioni articolo" — stessa idea di
 * ArticleReactions.tsx nel frontend Next.js: tre badge impilati (Share,
 * Commenti, Love) con un pallino numerico sovrapposto. "Share" apre il
 * popup di condivisione (vedi blocco Share Buttons e assets/js/reactions.js)
 * e incrementa subito il contatore; "Love" fa toggle con lo stesso
 * pattern (localStorage ricorda se questo browser ha gia' messo Love,
 * nessuna protezione anti-frode lato server — stessa scelta del sito
 * headless).
 *
 * @var array    $attributes
 * @var string   $content
 * @var WP_Block $block
 */
$post_id = isset( $block->context['postId'] ) ? (int) $block->context['postId'] : get_the_ID();
if ( ! $post_id ) {
	return;
}

$shares         = pp_get_shares( $post_id );
$loves          = pp_get_loves( $post_id );
$comments_count = get_comments_number( $post_id );

wp_enqueue_script( 'pp-reactions' );
wp_enqueue_style( 'peperoncini-piccanti-style' );

$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => 'pp-reactions' ) );
?>
<div <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> data-pp-reactions data-post-id="<?php echo (int) $post_id; ?>">
	<button type="button" class="pp-reactions__badge pp-reactions__badge--share" data-pp-reaction="share" aria-label="Condividi: <?php echo (int) $shares; ?>">
		<span class="pp-reactions__ring">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>
		</span>
		<span class="pp-reactions__count" data-pp-reaction-count="share"><?php echo (int) $shares; ?></span>
		<span class="pp-reactions__label">Share</span>
	</button>

	<div class="pp-reactions__badge pp-reactions__badge--comment" aria-label="Commenti: <?php echo (int) $comments_count; ?>">
		<span class="pp-reactions__ring">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-4-1L3 20l1-5.5a8.38 8.38 0 0 1-1-4 8.5 8.5 0 0 1 8.5-8.5 8.38 8.38 0 0 1 8.5 8.5z"/></svg>
		</span>
		<span class="pp-reactions__count"><?php echo (int) $comments_count; ?></span>
		<span class="pp-reactions__label">Comment</span>
	</div>

	<button type="button" class="pp-reactions__badge pp-reactions__badge--love" data-pp-reaction="love" aria-label="Love: <?php echo (int) $loves; ?>">
		<span class="pp-reactions__ring">
			<svg data-pp-love-icon width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
		</span>
		<span class="pp-reactions__count" data-pp-reaction-count="love"><?php echo (int) $loves; ?></span>
		<span class="pp-reactions__label">Love</span>
	</button>
</div>
