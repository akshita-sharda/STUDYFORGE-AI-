export default function CodeScene() {
  return <div className="code-scene" aria-hidden="true">
    <div className="scene-orbit" />
    <div className="clay-window"><div className="window-chrome"><i /><i /><i /><span>study.ts</span></div><div className="window-code"><span className="code-comment">// one concept at a time</span><br /><span className="code-purple">const</span> you = <span className="code-peach">"developer"</span>;<br /><br /><span className="code-purple">while</span> (curious) {'{'}<br />&nbsp; learn();<br />&nbsp; build();<br />&nbsp; grow();<br />{'}'}<span className="code-cursor" /></div></div>
    <div className="clay-tile tile-brackets">{'</>'}</div><div className="clay-tile tile-check">✓</div>
    <div className="code-sticker sticker-hello">hello, world<span>YOUR NEXT CHAPTER STARTS HERE</span></div>
    <div className="code-sticker sticker-build">think. code. repeat.</div>
    <span className="scene-spark spark-one">✦</span><span className="scene-spark spark-two">✧</span>
  </div>;
}
