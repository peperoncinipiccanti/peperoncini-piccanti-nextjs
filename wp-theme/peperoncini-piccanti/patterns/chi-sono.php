<?php
/**
 * Title: Chi sono
 * Slug: peperoncini-piccanti/chi-sono
 * Categories: peperoncini-piccanti
 * Description: Riquadro biografico di chiusura home page — stesso testo e stesse due foto di chiusura ("peperoncini.jpg", "zen.jpg", incluse in assets/images/) della sezione "Chi sono" del sito attuale (AboutSection.tsx). Sostituisci pure il testo dall'editor: e' un blocco normale, non serve toccare il tema.
 */
$pp_img_peperoncini = esc_url( get_theme_file_uri( 'assets/images/chi-sono-peperoncini.jpg' ) );
$pp_img_zen          = esc_url( get_theme_file_uri( 'assets/images/chi-sono-zen.jpg' ) );
?>
<!-- wp:group {"align":"full","backgroundColor":"sfondo-chiaro","style":{"spacing":{"padding":{"top":"var:preset|spacing|50","bottom":"var:preset|spacing|50"}}},"layout":{"type":"constrained","contentSize":"760px"}} -->
<div class="wp-block-group alignfull has-sfondo-chiaro-background-color has-background" style="padding-top:var(--wp--preset--spacing--50);padding-bottom:var(--wp--preset--spacing--50)">

	<!-- wp:heading {"level":2,"style":{"typography":{"fontSize":"1.6rem"}}} -->
	<h2 class="wp-block-heading" style="font-size:1.6rem">Chi sono</h2>
	<!-- /wp:heading -->

	<!-- wp:paragraph -->
	<p><strong>Nomen Omen:</strong> PeperonciniPiccanti.com è un blog sui Peperoncini Piccanti. Informazioni, curiosità e ricette a base di Peperoncini Piccanti, collettati in un sito sul peperoncino di nome e di fatto.</p>
	<!-- /wp:paragraph -->

	<!-- wp:paragraph -->
	<p>Un blog corale, scritto con il contributo di tutti gli appassionati di Peperoncini Piccanti. PeperonciniPiccanti.com vuole quindi essere un angolo del web in cui leggere e commentare i post inseriti, contribuire con ricette, foto e informazioni, ma tutto con lo stesso denominatore comune: peperoncino.</p>
	<!-- /wp:paragraph -->

	<!-- wp:separator {"opacity":"css"} -->
	<hr class="wp-block-separator has-alpha-channel-opacity" />
	<!-- /wp:separator -->

	<!-- wp:paragraph -->
	<p>Mi chiamo Daniele, da oltre 20 anni mi occupo di marketing.</p>
	<!-- /wp:paragraph -->

	<!-- wp:paragraph -->
	<p>Lavoro come direttore tecnico per un'importante agenzia di comunicazione in Sardegna.</p>
	<!-- /wp:paragraph -->

	<!-- wp:paragraph -->
	<p>Precedentemente ho lavorato per la più grande catena di drugstore in Italia, ovvero Acqua&amp;Sapone, e ancor prima come marketing manager per un'altra catena sarda di negozi (drugstore e profumerie) ma ho iniziato come sales e marketing per una società editrice specializzata nel campo dei free-press.</p>
	<!-- /wp:paragraph -->

	<!-- wp:paragraph -->
	<p>Nato a Roma, cresciuto in Sardegna, partito alla conquista del mondo. Intrinsecamente cosmopolita.</p>
	<!-- /wp:paragraph -->

	<!-- wp:paragraph -->
	<p>Web, rally, cucina e Peperoncini Piccanti sono le mie passioni: da qui la decisione di unirle in un blog. Non tutte, ovviamente, potete stare tranquilli: non vi proporrò mai spaghetti aglio, olio motore e peperoncino!!!</p>
	<!-- /wp:paragraph -->

	<!-- wp:paragraph -->
	<p>Ho iniziato a coltivare Peperoncini Piccanti nel 1998 e, da allora, non ho mai smesso, destinando sempre un angolo degli appartamenti che mi hanno via via ospitato a piccolo orto, per tenere accesa la mia passione.</p>
	<!-- /wp:paragraph -->

	<!-- wp:paragraph -->
	<p>Mi diletto a coltivare ogni varietà di peperoncino e, tra le mie preferite, ci sono quelle extra piccanti, con cui torturo parenti, amici e colleghi, sottoponendoli a focosissimi assaggi.</p>
	<!-- /wp:paragraph -->

	<!-- wp:paragraph -->
	<p>Ma soprattutto torturo i miei genitori che, vivendo in Sardegna, hanno un giardino baciato da un sole caldo e fertile: è qui che coltivo la maggior parte dei miei peperoncini, affidandone loro la cura in mia assenza e, fino a qualche anno fa la protezione del raccolto da Zen, il Bobtail nuvola di pelo, che se n'è andato senza avermi mai perdonato il trasferimento&hellip;</p>
	<!-- /wp:paragraph -->

	<!-- wp:paragraph -->
	<p>Non mi resta che augurarvi buona navigazione e più PeperonciniPiccanti per il futuro!</p>
	<!-- /wp:paragraph -->

	<!-- wp:columns {"style":{"spacing":{"blockGap":{"left":"1rem"}}}} -->
	<div class="wp-block-columns">
		<!-- wp:column -->
		<div class="wp-block-column">
			<!-- wp:image {"sizeSlug":"large","style":{"border":{"radius":"0px"}}} -->
			<figure class="wp-block-image size-large">
				<img src="<?php echo $pp_img_peperoncini; ?>" alt="Peperoncini piccanti rossi, gialli e arancioni appena raccolti" />
			</figure>
			<!-- /wp:image -->
		</div>
		<!-- /wp:column -->

		<!-- wp:column -->
		<div class="wp-block-column">
			<!-- wp:image {"sizeSlug":"large","style":{"border":{"radius":"0px"}}} -->
			<figure class="wp-block-image size-large">
				<img src="<?php echo $pp_img_zen; ?>" alt="Zen, il Bobtail nuvola di pelo, in giardino con un pallone" />
			</figure>
			<!-- /wp:image -->
		</div>
		<!-- /wp:column -->
	</div>
	<!-- /wp:columns -->

	<!-- wp:social-links {"size":"has-normal-icon-size"} -->
	<ul class="wp-block-social-links has-normal-icon-size">
		<!-- wp:social-link {"url":"https://www.facebook.com/peperoncinipiccanti","service":"facebook"} /-->
		<!-- wp:social-link {"url":"https://www.instagram.com/peperoncinipiccanti","service":"instagram"} /-->
	</ul>
	<!-- /wp:social-links -->

</div>
<!-- /wp:group -->
