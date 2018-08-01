{
    /**
     * (Sicht von oben) - Dreieck mit Normale nach oben (+y)
     * 
     *            ∧ y 
     *            |
     *         B(0,-2)  
     *            |
     *  ----------+-----------> x
     *            |
     *    C(2,2)  |   A(2,2)
     *            |
     * 
     */

    let a = new vec3(2, 0, 2)
    let b = new vec3(0, 0, -2)
    let c = new vec3(-2, 0, 2)
    let tri = new Triangle(a, b, c)

    {
        let n = tri.getCCNormal()
        console.assert(n.x==0 && n.y==1 &&n.z==0, "getCCNormal")
    }
    {
        //   ↓
        //   ▲
        let o = new vec3(0, 5, 0);
        let v = new vec3(0, -1, 0);
        let t = tri.moellerTrumbore(o, v)
        console.assert(t == 5, "MoellerTrumbore: Strahl über Dreieck, zeigt nach unten: t = " + t)
    }
    {
        //   ▲
        //   ↓
        let o = new vec3(0, -5, 0);
        let v = new vec3(0, -1, 0);
        let t = tri.moellerTrumbore(o, v)
        console.assert(t == -5, "MoellerTrumbore: Strahl unter Dreieck, zeigt nach unten: t = " + t)
    }
    {
        //   ↑
        //   ▲
        let o = new vec3(0, 5, 0);
        let v = new vec3(0, 1, 0);
        let t = tri.moellerTrumbore(o, v)
        console.assert(t == -5, "MoellerTrumbore: Strahl über Dreieck, zeigt nach oben: t = " + t)
    }
    {
        //   ▲
        //   ↑
        let o = new vec3(0, -5, 0);
        let v = new vec3(0, 1, 0);
        let t = tri.moellerTrumbore(o, v)
        console.assert(t == 5, "MoellerTrumbore: Strahl unter Dreieck, zeigt nach oben: t = " + t)
    }

    /**
     * Test: Treffer auf Kante
     */       {
        //  ↓
        //   ▲ 
        let o = new vec3(2, 5, 2);
        let v = new vec3(0, -1, 0);
        let t = tri.moellerTrumbore(o, v)
        console.assert(t == 5, t)
    }
    {
        //  ↑
        //   ▲ 
        let o = new vec3(2, 5, 2);
        let v = new vec3(0, 1, 0);
        let t = tri.moellerTrumbore(o, v)
        console.assert(t == -5, "MoellerTrumbore: Test an der Kante, Strahl über Dreieck, zeigt nach oben: t = " + t)
    }

    /**
     * Test: Keine Treffer
     */    
    {
        // ↑ 
        //   ▲ 
        let o = new vec3(2.001, 5, 2);
        let v = new vec3(0, 1, 0);
        let t = tri.moellerTrumbore(o, v)
        console.assert(t == null, "Senkrecht vorbei")
    }
    {
        //   →
        //   ▲ 
        let o = new vec3(0, 5, 0);
        let v = new vec3(1, 0, 0);
        let t = tri.moellerTrumbore(o, v)
        console.assert(t == null, "Parallel vobei")
    }
    {
        //   ←
        //   ▲ 
        let o = new vec3(0, 5, 0);
        let v = new vec3(-1, 0, 0);
        let t = tri.moellerTrumbore(o, v)
        console.assert(t == null, "Parallel vobei")
    }
    {
        //   
        // → ▲ 
        let o = new vec3(5, 0, 0);
        let v = new vec3(1, 0, 0);
        let t = tri.moellerTrumbore(o, v)
        console.assert(t == null, "Parallel in der Ebene")
    }

    /**
     * getSegmentContact Tests
     */
    {
        let a = new vec3(-1, -1, 0);
        let b = new vec3(1, 1, 0);
        let contact = tri.getSegmentContact(a, b)
        console.assert(vec3.equals(contact.point, new vec3(0,0,0)))
    }
}
